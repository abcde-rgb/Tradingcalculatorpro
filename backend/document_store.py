import json
import re
import uuid
from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple


_MISSING = object()


def _json_default(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _json_dumps(value: Any) -> str:
    return json.dumps(value, default=_json_default, separators=(",", ":"))


def _get_field(doc: Dict[str, Any], field: str) -> Any:
    cur: Any = doc
    for part in field.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return _MISSING
        cur = cur[part]
    return cur


def _set_field(doc: Dict[str, Any], field: str, value: Any) -> None:
    cur = doc
    parts = field.split(".")
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            nxt = {}
            cur[part] = nxt
        cur = nxt
    cur[parts[-1]] = value


def _unset_field(doc: Dict[str, Any], field: str) -> None:
    cur = doc
    parts = field.split(".")
    for part in parts[:-1]:
        cur = cur.get(part)
        if not isinstance(cur, dict):
            return
    cur.pop(parts[-1], None)


def _compare(left: Any, right: Any, op: str) -> bool:
    if left is _MISSING or left is None:
        return False
    if isinstance(left, datetime):
        left = left.isoformat()
    if isinstance(right, datetime):
        right = right.isoformat()
    try:
        if op == "$gte":
            return left >= right
        if op == "$lte":
            return left <= right
        if op == "$gt":
            return left > right
        if op == "$lt":
            return left < right
    except TypeError:
        return False
    return False


def _matches_operator(actual: Any, condition: Dict[str, Any]) -> bool:
    for op, expected in condition.items():
        if op == "$options":
            continue
        if op == "$ne":
            if actual is not _MISSING and actual == expected:
                return False
        elif op in ("$gte", "$lte", "$gt", "$lt"):
            if not _compare(actual, expected, op):
                return False
        elif op == "$in":
            if actual is _MISSING or actual not in expected:
                return False
        elif op == "$regex":
            if actual is _MISSING or actual is None:
                return False
            flags = 0
            if "i" in str(condition.get("$options", "")):
                flags |= re.IGNORECASE
            if hasattr(expected, "search"):
                if not expected.search(str(actual)):
                    return False
            elif not re.search(str(expected), str(actual), flags):
                return False
        else:
            if actual != condition:
                return False
    return True


def _matches(doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(doc, branch) for branch in expected):
                return False
            continue
        if key == "$and":
            if not all(_matches(doc, branch) for branch in expected):
                return False
            continue

        actual = _get_field(doc, key)
        if isinstance(expected, dict) and any(str(k).startswith("$") for k in expected):
            if not _matches_operator(actual, expected):
                return False
        elif expected is None:
            if actual not in (_MISSING, None):
                return False
        elif actual is _MISSING or actual != expected:
            return False
    return True


def _project(doc: Dict[str, Any], projection: Optional[Dict[str, int]]) -> Dict[str, Any]:
    out = dict(doc)
    if not projection:
        out.pop("_id", None)
        return out

    include_keys = [key for key, value in projection.items() if key != "_id" and bool(value)]
    if include_keys:
        out = {key: _get_field(doc, key) for key in include_keys if _get_field(doc, key) is not _MISSING}
        if projection.get("_id"):
            out["_id"] = doc.get("_id")
        return out

    for key, value in projection.items():
        if not value:
            _unset_field(out, key)
    return out


def _doc_id(doc: Dict[str, Any]) -> str:
    for key in ("_id", "id", "key", "token", "jti", "session_id"):
        value = doc.get(key)
        if value is not None:
            return str(value)
    value = str(uuid.uuid4())
    doc.setdefault("_id", value)
    return value


def _base_doc_from_filter(query: Dict[str, Any]) -> Dict[str, Any]:
    doc: Dict[str, Any] = {}
    for key, value in (query or {}).items():
        if key.startswith("$"):
            continue
        if isinstance(value, dict) and any(str(k).startswith("$") for k in value):
            continue
        _set_field(doc, key, value)
    return doc


def _apply_update(doc: Dict[str, Any], update: Dict[str, Any], inserting: bool = False) -> None:
    if not update:
        return
    if not any(str(key).startswith("$") for key in update):
        doc.clear()
        doc.update(update)
        return
    for key, value in update.get("$set", {}).items():
        _set_field(doc, key, value)
    if inserting:
        for key, value in update.get("$setOnInsert", {}).items():
            _set_field(doc, key, value)
    for key, value in update.get("$inc", {}).items():
        current = _get_field(doc, key)
        if current is _MISSING or current is None:
            current = 0
        _set_field(doc, key, current + value)
    for key in update.get("$unset", {}).keys():
        _unset_field(doc, key)


def _sort_key(doc: Dict[str, Any], field: str) -> Tuple[bool, Any]:
    value = _get_field(doc, field)
    if value is _MISSING or value is None:
        return (True, "")
    if isinstance(value, datetime):
        return (False, value.isoformat())
    if isinstance(value, (int, float, str, bool)):
        return (False, value)
    return (False, str(value))


class InsertOneResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int, upserted_id: Optional[str] = None):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class PostgresCursor:
    def __init__(self, collection: "PostgresCollection", query=None, projection=None, pipeline=None):
        self.collection = collection
        self.query = query or {}
        self.projection = projection
        self.pipeline = pipeline
        self._sorts: List[Tuple[str, int]] = []
        self._skip = 0
        self._limit: Optional[int] = None
        self._resolved: Optional[List[Dict[str, Any]]] = None
        self._iter_index = 0

    def sort(self, key_or_list, direction: Optional[int] = None):
        if isinstance(key_or_list, list):
            self._sorts = [(key, int(order)) for key, order in key_or_list]
        else:
            self._sorts = [(str(key_or_list), int(direction or 1))]
        return self

    def skip(self, count: int):
        self._skip = max(0, int(count))
        return self

    def limit(self, count: int):
        self._limit = max(0, int(count))
        return self

    async def _resolve(self) -> List[Dict[str, Any]]:
        if self._resolved is not None:
            return self._resolved

        docs = await self.collection._matching_docs(self.query, self.projection)
        if self.pipeline is not None:
            docs = self.collection._apply_pipeline(docs, self.pipeline)

        for field, direction in reversed(self._sorts):
            docs.sort(key=lambda doc: _sort_key(doc, field), reverse=direction < 0)
        if self._skip:
            docs = docs[self._skip:]
        if self._limit is not None:
            docs = docs[:self._limit]
        self._resolved = docs
        return docs

    async def to_list(self, length: Optional[int] = None):
        docs = await self._resolve()
        if length is None:
            return list(docs)
        return list(docs[:length])

    def __aiter__(self):
        self._iter_index = 0
        return self

    async def __anext__(self):
        docs = await self._resolve()
        if self._iter_index >= len(docs):
            raise StopAsyncIteration
        value = docs[self._iter_index]
        self._iter_index += 1
        return value


class PostgresCollection:
    def __init__(self, database: "PostgresDocumentDatabase", name: str):
        self.database = database
        self.name = name

    async def _all_rows(self) -> List[Tuple[str, Dict[str, Any]]]:
        pool = await self.database.client._pool()
        rows = await pool.fetch(
            "select doc_id, data from app_documents where collection = $1",
            self.name,
        )
        out = []
        for row in rows:
            data = row["data"]
            if isinstance(data, str):
                data = json.loads(data)
            out.append((row["doc_id"], dict(data)))
        return out

    async def _matching_docs(self, query=None, projection=None) -> List[Dict[str, Any]]:
        rows = await self._all_rows()
        return [_project(doc, projection) for _id, doc in rows if _matches(doc, query)]

    async def _upsert_row(self, doc_id: str, doc: Dict[str, Any]) -> None:
        pool = await self.database.client._pool()
        await pool.execute(
            """
            insert into app_documents (collection, doc_id, data, updated_at)
            values ($1, $2, $3::jsonb, now())
            on conflict (collection, doc_id)
            do update set data = excluded.data, updated_at = now()
            """,
            self.name,
            doc_id,
            _json_dumps(doc),
        )

    async def _delete_row(self, doc_id: str) -> None:
        pool = await self.database.client._pool()
        await pool.execute(
            "delete from app_documents where collection = $1 and doc_id = $2",
            self.name,
            doc_id,
        )

    def find(self, query=None, projection=None) -> PostgresCursor:
        return PostgresCursor(self, query=query, projection=projection)

    async def find_one(self, query=None, projection=None):
        rows = await self.find(query, projection).limit(1).to_list(1)
        return rows[0] if rows else None

    async def insert_one(self, doc: Dict[str, Any]) -> InsertOneResult:
        to_store = dict(doc)
        doc_id = _doc_id(to_store)
        await self._upsert_row(doc_id, to_store)
        return InsertOneResult(doc_id)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> UpdateResult:
        for doc_id, doc in await self._all_rows():
            if _matches(doc, query):
                before = _json_dumps(doc)
                _apply_update(doc, update, inserting=False)
                await self._upsert_row(doc_id, doc)
                return UpdateResult(1, 1 if _json_dumps(doc) != before else 0)

        if not upsert:
            return UpdateResult(0, 0)

        doc = _base_doc_from_filter(query)
        _apply_update(doc, update, inserting=True)
        doc_id = _doc_id(doc)
        await self._upsert_row(doc_id, doc)
        return UpdateResult(0, 1, upserted_id=doc_id)

    async def delete_one(self, query: Dict[str, Any]) -> DeleteResult:
        for doc_id, doc in await self._all_rows():
            if _matches(doc, query):
                await self._delete_row(doc_id)
                return DeleteResult(1)
        return DeleteResult(0)

    async def delete_many(self, query: Dict[str, Any]) -> DeleteResult:
        deleted = 0
        for doc_id, doc in await self._all_rows():
            if _matches(doc, query):
                await self._delete_row(doc_id)
                deleted += 1
        return DeleteResult(deleted)

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return len(await self._matching_docs(query, None))

    async def create_index(self, *args, **kwargs):
        return kwargs.get("name") or "jsonb_document_index"

    def aggregate(self, pipeline: Iterable[Dict[str, Any]]) -> PostgresCursor:
        return PostgresCursor(self, pipeline=list(pipeline))

    def _apply_pipeline(self, docs: List[Dict[str, Any]], pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        out = list(docs)
        for stage in pipeline:
            if "$match" in stage:
                out = [doc for doc in out if _matches(doc, stage["$match"])]
            elif "$group" in stage:
                out = self._group(out, stage["$group"])
            elif "$sort" in stage:
                for field, direction in reversed(list(stage["$sort"].items())):
                    out.sort(key=lambda doc: _sort_key(doc, field), reverse=int(direction) < 0)
            elif "$limit" in stage:
                out = out[: int(stage["$limit"])]
        return out

    def _group(self, docs: List[Dict[str, Any]], spec: Dict[str, Any]) -> List[Dict[str, Any]]:
        groups: Dict[Any, Dict[str, Any]] = {}
        group_expr = spec.get("_id")
        for doc in docs:
            if isinstance(group_expr, str) and group_expr.startswith("$"):
                group_key = _get_field(doc, group_expr[1:])
                if group_key is _MISSING:
                    group_key = None
            else:
                group_key = group_expr
            group = groups.setdefault(group_key, {"_id": group_key})
            for out_key, accumulator in spec.items():
                if out_key == "_id":
                    continue
                if "$sum" in accumulator:
                    sum_expr = accumulator["$sum"]
                    if isinstance(sum_expr, (int, float)):
                        amount = sum_expr
                    elif isinstance(sum_expr, str) and sum_expr.startswith("$"):
                        amount = _get_field(doc, sum_expr[1:])
                        amount = 0 if amount in (_MISSING, None) else amount
                    else:
                        amount = 0
                    group[out_key] = group.get(out_key, 0) + amount
                elif "$first" in accumulator and out_key not in group:
                    first_expr = accumulator["$first"]
                    if isinstance(first_expr, str) and first_expr.startswith("$"):
                        value = _get_field(doc, first_expr[1:])
                        group[out_key] = None if value is _MISSING else value
                    else:
                        group[out_key] = first_expr
        return list(groups.values())


class PostgresDocumentDatabase:
    def __init__(self, client: "PostgresDocumentClient", name: str):
        self.client = client
        self.name = name
        self._collections: Dict[str, PostgresCollection] = {}

    def __getattr__(self, name: str) -> PostgresCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        return self[name]

    def __getitem__(self, name: str) -> PostgresCollection:
        if name not in self._collections:
            self._collections[name] = PostgresCollection(self, name)
        return self._collections[name]

    async def command(self, name: str):
        if name != "ping":
            return {"ok": 1}
        pool = await self.client._pool()
        await pool.fetchval("select 1")
        return {"ok": 1}


class PostgresDocumentClient:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self._pool_instance = None

    async def _init_connection(self, conn):
        await conn.set_type_codec(
            "jsonb",
            encoder=_json_dumps,
            decoder=json.loads,
            schema="pg_catalog",
            format="text",
        )

    async def _pool(self):
        if self._pool_instance is None:
            import asyncpg

            self._pool_instance = await asyncpg.create_pool(
                dsn=self.database_url,
                min_size=1,
                max_size=5,
                init=self._init_connection,
            )
            async with self._pool_instance.acquire() as conn:
                await conn.execute(
                    """
                    create table if not exists app_documents (
                        collection text not null,
                        doc_id text not null,
                        data jsonb not null,
                        updated_at timestamptz not null default now(),
                        primary key (collection, doc_id)
                    )
                    """
                )
                await conn.execute(
                    """
                    create index if not exists app_documents_collection_updated_idx
                    on app_documents (collection, updated_at desc)
                    """
                )
                await conn.execute(
                    """
                    create index if not exists app_documents_data_gin_idx
                    on app_documents using gin (data)
                    """
                )
        return self._pool_instance

    def __getitem__(self, name: str) -> PostgresDocumentDatabase:
        return PostgresDocumentDatabase(self, name)

    async def close(self) -> None:
        if self._pool_instance is not None:
            await self._pool_instance.close()
            self._pool_instance = None
