import { BACKEND_URL } from '@/lib/apiConfig';
import { useEffect, useMemo, useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Crown, DollarSign, TrendingUp, Search, Download,
  Shield, ShieldOff, RefreshCw, Mail, Globe2, Calendar,
  Plug, Check, X, Plus, Pencil, Trash2, KeyRound, Save, Loader2,
  Eye, EyeOff, History, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { useSEO } from '@/hooks/useSEO';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';

const API = `${BACKEND_URL}/api`;

const PLAN_OPTIONS = [
  { value: 'none',      label: 'Free' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual',    label: 'Annual' },
  { value: 'lifetime',  label: 'Lifetime' },
];

/**
 * /admin — gated by `is_admin === true`.
 * Provides:
 *   - Global metrics + filters + CSV export
 *   - Google integrations editor (GA4, GTM, GSC, AdSense, Bing) saved to DB
 *   - Full user CRUD: create, edit, delete, reset password, promote/demote
 */
export default function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuthStore();

  useSEO({ title: 'Admin', description: 'Panel administrativo', canonicalPath: '/admin' });

  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('all');
  const [provider, setProvider] = useState('all');
  const [locale] = useState('all');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  );

  const loadAll = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (plan !== 'all')     params.set('plan', plan);
    if (provider !== 'all') params.set('provider', provider);
    if (locale !== 'all')   params.set('locale', locale);
    params.set('limit', '500');

    try {
      const [mRes, uRes] = await Promise.all([
        fetch(`${API}/admin/metrics`, { headers }),
        fetch(`${API}/admin/users?${params.toString()}`, { headers }),
      ]);
      // Session expired → force re-login with a clear message
      if (mRes.status === 401 || uRes.status === 401) {
        toast.error('Tu sesión ha caducado. Vuelve a iniciar sesión.', { duration: 6000 });
        try { useAuthStore.getState().logout(); } catch { /* ignore */ }
        navigate('/login');
        return;
      }
      if (mRes.status === 403 || uRes.status === 403) {
        toast.error(t('adminAccessDenied'));
        navigate('/dashboard');
        return;
      }
      if (!mRes.ok || !uRes.ok) {
        throw new Error(`metrics=${mRes.status} users=${uRes.status}`);
      }
      setMetrics(await mRes.json());
      const data = await uRes.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error('[admin loadAll]', err);
      toast.error(err.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`${API}/admin/users.csv`, { headers });
      if (!res.ok) throw new Error('csv export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tcp-users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('adminCsvExported'));
    } catch {
      toast.error(t('adminCsvExportError'));
    }
  };

  const togglePromote = async (email, currentlyAdmin) => {
    try {
      const res = await fetch(`${API}/admin/promote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, is_admin: !currentlyAdmin }),
      });
      if (!res.ok) throw new Error('promote failed');
      toast.success(currentlyAdmin ? t('adminDemoteOk') : t('adminPromoteOk'));
      loadAll();
    } catch {
      toast.error('Error');
    }
  };

  const deleteUser = async (u) => {
    try {
      const res = await fetch(`${API}/admin/users/${u.id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'delete failed');
      toast.success(`Usuario ${u.email} eliminado`);
      setConfirmDelete(null);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Error eliminando usuario');
    }
  };

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle>{t('adminAccessDenied')}</CardTitle></CardHeader>
          <CardContent>
            <Link to="/dashboard"><Button>{t('volverAlDashboard_e3a957') || 'Volver'}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20" data-testid="admin-page">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-unbounded text-3xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" /> {t('adminPanelTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('adminPanelSubtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll} className="gap-2" data-testid="admin-refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('adminRefresh')}
            </Button>
            <Button onClick={handleExportCsv} variant="outline" className="gap-2" data-testid="admin-export-csv">
              <Download className="w-4 h-4" /> {t('adminExportCsv')}
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2" data-testid="admin-new-user">
              <Plus className="w-4 h-4" /> Nuevo usuario
            </Button>
          </div>
        </div>

        {/* Metrics grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard icon={Users} label={t('adminMetricUsers')}
              value={metrics.total_users} testId="metric-total-users" />
            <MetricCard icon={Crown} label={t('adminMetricPremium')}
              value={metrics.premium_users} valueClass="text-primary" testId="metric-premium" />
            <MetricCard icon={DollarSign} label="MRR"
              value={`$${metrics.mrr_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              valueClass="text-green-500" testId="metric-mrr" />
            <MetricCard icon={TrendingUp} label={t('adminMetricNew30d')}
              value={metrics.new_users_30d} testId="metric-new-30d" />
            <MetricCard icon={Globe2} label={t('adminMetricLocales')}
              value={metrics.by_locale.length} testId="metric-locales" />
          </div>
        )}

        {/* Google integrations editor */}
        <IntegrationsEditor headers={headers} t={t} />

        {/* Custom API manager */}
        <CustomAPIManager headers={headers} />

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('adminSearchPlaceholder')}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAll()}
                  className="pl-10"
                  data-testid="admin-search-input"
                />
              </div>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger data-testid="admin-filter-plan"><SelectValue placeholder={t('adminFilterPlan')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminFilterPlan')}: {t('adminAll')}</SelectItem>
                  <SelectItem value="none">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger data-testid="admin-filter-provider"><SelectValue placeholder={t('adminFilterProvider')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminFilterProvider')}: {t('adminAll')}</SelectItem>
                  <SelectItem value="password">Email + Password</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadAll} className="gap-2" data-testid="admin-apply-filters">
                {t('adminApplyFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('adminUsersTable')}</CardTitle>
              <Badge variant="outline">{total} {t('adminTotal')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-users-table">              <thead className="bg-muted/40">
                <tr className="text-left">
                  <Th><Mail className="w-3 h-3 inline" /> Email</Th>
                  <Th>{t('adminColName')}</Th>
                  <Th>{t('adminColPlan')}</Th>
                  <Th>{t('adminColStatus')}</Th>
                  <Th>{t('adminColProvider')}</Th>
                  <Th><Calendar className="w-3 h-3 inline" /> {t('adminColCreated')}</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isDemo = u.email === 'demo@btccalc.pro';
                  return (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2">
                        <Badge variant={u.is_premium ? 'default' : 'outline'}>
                          {u.subscription_plan || 'free'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={u.is_premium ? 'default' : 'secondary'}
                          className={u.is_premium ? 'bg-green-500/15 text-green-600' : ''}>
                          {u.is_premium ? 'active' : (u.subscription_status || '—')}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-muted-foreground">{u.auth_provider || 'password'}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {u.created_at ? u.created_at.slice(0, 10) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditing(u)}
                            className="gap-1 h-7" data-testid={`admin-edit-${u.email}`}>
                            <Pencil className="w-3 h-3" /> Editar
                          </Button>
                          <Button size="sm" variant={u.is_admin ? 'destructive' : 'outline'}
                            onClick={() => togglePromote(u.email, u.is_admin)}
                            className="gap-1 h-7" data-testid={`admin-toggle-${u.email}`}>
                            {u.is_admin
                              ? <><ShieldOff className="w-3 h-3" /> {t('adminDemote')}</>
                              : <><Shield className="w-3 h-3" /> {t('adminPromote')}</>}
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => setResetting(u)}
                            className="gap-1 h-7" data-testid={`admin-reset-${u.email}`}>
                            <KeyRound className="w-3 h-3" /> Reset
                          </Button>
                          {!isSelf && !isDemo && (
                            <Button size="sm" variant="destructive"
                              onClick={() => setConfirmDelete(u)}
                              className="gap-1 h-7" data-testid={`admin-delete-${u.email}`}>
                              <Trash2 className="w-3 h-3" /> Borrar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      {loading ? t('loading') : t('adminNoUsers')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Audit Log */}
        <AuditLogPanel headers={headers} />
      </main>

      {/* MODALS */}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)}
        headers={headers} onCreated={loadAll} />      <EditUserDialog user={editing} onClose={() => setEditing(null)}
        headers={headers} onSaved={loadAll} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} headers={headers} />
      <ConfirmDeleteDialog user={confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteUser(confirmDelete)} />
    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</th>
);

const MetricCard = ({ icon: Icon, label, value, valueClass = '', testId }) => (
  <Card className="bg-card border-border" data-testid={testId}>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
);

/* ============================================================
 *  GOOGLE / STRIPE / PAYPAL / MISC INTEGRATIONS EDITOR
 * ============================================================ */

const INTEGRATION_SECTIONS = [
  {
    id: 'google',
    title: 'Google (Identity Platform, Analytics, Ads, SEO)',
    description:
      'Google Identity Platform usa el OAuth Client ID + Client Secret para login con Google. ' +
      'Recuerda añadir esta URL como JavaScript Origin autorizado en Google Cloud Console.',
    fields: [
      { id: 'google_client_id',     label: 'OAuth Client ID',         secret: false, placeholder: '704...apps.googleusercontent.com', hint: 'console.cloud.google.com → Credentials' },
      { id: 'google_client_secret', label: 'OAuth Client Secret',     secret: true,  placeholder: 'GOCSPX-...',                       hint: 'Same screen as the Client ID' },
      { id: 'ga4_measurement_id',   label: 'Analytics 4 Measurement', secret: false, placeholder: 'G-XXXXXXXXXX',                      hint: 'analytics.google.com → Admin → Data Streams' },
      { id: 'gtm_id',               label: 'Tag Manager Container',   secret: false, placeholder: 'GTM-XXXXXXX',                       hint: 'tagmanager.google.com → workspace overview' },
      { id: 'gsc_verification',     label: 'Search Console (meta)',   secret: false, placeholder: 'AbC123…',                           hint: 'search.google.com/search-console → HTML tag' },
      { id: 'adsense_publisher_id', label: 'AdSense Publisher ID',    secret: false, placeholder: 'ca-pub-XXXXXXXXXXXXXXXX',          hint: 'adsense.google.com → Account' },
    ],
  },
  {
    id: 'stripe',
    title: 'Stripe (pagos con tarjeta y SEPA)',
    description: 'Las claves se aplican en caliente al runtime — no necesitas reiniciar el backend.',
    fields: [
      { id: 'stripe_publishable_key', label: 'Publishable Key',  secret: false, placeholder: 'pk_live_… o pk_test_…', hint: 'dashboard.stripe.com → Developers → API keys' },
      { id: 'stripe_secret_key',      label: 'Secret Key',       secret: true,  placeholder: 'sk_live_… o sk_test_…', hint: 'NUNCA la expongas al frontend; sólo backend' },
      { id: 'stripe_webhook_secret',  label: 'Webhook Signing Secret', secret: true, placeholder: 'whsec_…',           hint: 'Webhooks → Add endpoint → Reveal signing secret' },
    ],
  },
  {
    id: 'paypal',
    title: 'PayPal',
    description: 'Configura sandbox para pruebas y live para producción.',
    fields: [
      { id: 'paypal_client_id',     label: 'Client ID',     secret: false, placeholder: 'AYS…',                hint: 'developer.paypal.com → Apps & Credentials' },
      { id: 'paypal_client_secret', label: 'Client Secret', secret: true,  placeholder: 'EJX…',                hint: 'Mismo dashboard, dentro de cada app' },
      { id: 'paypal_mode',          label: 'Mode',          secret: false, placeholder: 'sandbox | live',      hint: 'Usa "sandbox" para pruebas, "live" en producción' },
    ],
  },
  {
    id: 'others',
    title: 'Otras integraciones (Crypto, SEO, Email, Reviews)',
    description: '',
    fields: [
      { id: 'coinbase_api_key',       label: 'Coinbase Commerce API Key', secret: true,  placeholder: '0123abcd-…',  hint: 'commerce.coinbase.com → Settings → API Keys' },
      { id: 'sendgrid_api_key',       label: 'SendGrid API Key',          secret: true,  placeholder: 'SG.…',         hint: 'app.sendgrid.com → Settings → API Keys' },
      { id: 'trustpilot_business_id', label: 'Trustpilot Business URL',   secret: false, placeholder: 'midominio.com', hint: 'business.trustpilot.com — usa el slug de la URL' },
      { id: 'clarity_project_id',     label: 'Microsoft Clarity Project', secret: false, placeholder: 'a1b2c3d4',     hint: 'clarity.microsoft.com → Settings → Setup' },
      { id: 'bing_verification',      label: 'Bing Webmaster meta',       secret: false, placeholder: 'XXXXX…',       hint: 'bing.com/webmasters → Meta tag verification' },
    ],
  },
];

function IntegrationField({ field, value, isSet, onChange }) {
  const [show, setShow] = useState(false);
  // Secret already saved → input is shown empty; placeholder communicates
  // that there is a stored value. Typing here writes a fresh secret only.
  const placeholder = field.secret && isSet
    ? '•••••••• (ya hay un valor guardado — escribe uno nuevo para reemplazarlo)'
    : (field.placeholder || '');

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2"
      data-testid={`integration-${field.id}`}>
      <div className="flex items-start justify-between gap-2">
        <Label htmlFor={field.id} className="text-sm font-medium">{field.label}</Label>
        {(isSet || (!field.secret && value))
          ? <Badge className="bg-green-500/15 text-green-500 gap-1"><Check className="w-3 h-3" /> Connected</Badge>
          : <Badge variant="outline" className="text-muted-foreground gap-1"><X className="w-3 h-3" /> Not configured</Badge>}
      </div>
      <div className="flex gap-1">
        <Input
          id={field.id}
          type={field.secret && !show ? 'password' : 'text'}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
          data-testid={`input-${field.id}`}
          autoComplete="off"
        />
        {field.secret && (
          <>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
              onClick={() => setShow((s) => !s)}
              title={show ? 'Hide' : 'Show'}>
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {isSet && (
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0 text-destructive"
                onClick={() => onChange('__CLEAR__')}
                title="Wipe this secret">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {field.hint}
        {field.secret && isSet && (
          <span className="ml-1 italic">— el valor está cifrado en servidor; este campo está vacío para evitar duplicarlo. Escribe un nuevo valor para reemplazar, o usa 🗑 para borrar.</span>
        )}
      </p>
    </div>
  );
}

function IntegrationsEditor({ headers, t }) {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API}/admin/settings`, { headers });
      if (res.status === 401) {
        toast.error('Tu sesión ha caducado. Vuelve a iniciar sesión.', { duration: 6000 });
        try { useAuthStore.getState().logout(); } catch { /* ignore */ }
        // Navigate to /login (window.location to bypass router context)
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          if (err && err.detail) detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      const data = await res.json();
      setSettings(data);
      // Build draft = current displayed values for every known field.
      // CRITICAL: for secret fields, we DROP the masked value (••••XXXX) from the
      // draft. Otherwise users would type after the bullets and produce corrupted
      // secrets ("••••XXXXmy_new_key") which get either silently skipped (if the
      // result starts with •) OR — worse — saved with bullets inside. Empty draft
      // + placeholder + green "Connected" badge is the safe pattern.
      const d = {};
      INTEGRATION_SECTIONS.forEach((sec) => sec.fields.forEach((f) => {
        const raw = data[f.id] || '';
        if (f.secret && (raw.startsWith('•') || data[`${f.id}_set`])) {
          d[f.id] = '';
        } else {
          d[f.id] = raw;
        }
      }));
      setDraft(d);
    } catch (err) {
      console.error('[admin/settings GET]', err);
      toast.error(`No se pudieron cargar las settings: ${err?.message || 'fallo desconocido'}`, { duration: 8000 });
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Build the body: send fields the admin actually changed, plus explicit
      // "__CLEAR__" wipes for secrets.
      const body = {};
      const errors = [];
      INTEGRATION_SECTIONS.forEach((sec) => sec.fields.forEach((f) => {
        const cur = (draft[f.id] ?? '').toString();

        if (f.secret) {
          // Secrets: draft is empty if a value already exists on the server
          // (we cleared the mask in load()). Only send when admin typed
          // something fresh OR the explicit __CLEAR__ sentinel.
          if (cur === '') return;                       // no change
          if (cur === '__CLEAR__') {
            body[f.id] = '__CLEAR__';
            return;
          }
          if (cur.startsWith('•')) {
            // Defensive: if mask leaked through, refuse to corrupt the secret.
            errors.push(`${f.label}: limpia el campo y escribe el valor completo`);
            return;
          }
          body[f.id] = cur;
        } else {
          // Public field: send if changed (allows clearing too).
          const orig = settings?.[f.id] ?? '';
          if (cur === orig) return;
          body[f.id] = cur;
        }
      }));

      if (errors.length) {
        toast.error(errors.join(' · '));
        setSaving(false);
        return;
      }
      if (Object.keys(body).length === 0) {
        toast.info('Sin cambios');
        setSaving(false);
        return;
      }
      const res = await fetch(`${API}/admin/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        toast.error('Tu sesión ha caducado. Vuelve a iniciar sesión.', { duration: 6000 });
        try { useAuthStore.getState().logout(); } catch { /* ignore */ }
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        // Bubble the backend's detail to the user (instead of the generic toast)
        let detail = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          if (err && err.detail) detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        } catch { /* ignore */ }
        // Log to console so the user can copy it for debugging
        console.error('[admin/settings PUT failed]', res.status, detail, 'body sent:', body);
        toast.error(`No se guardó: ${detail}`, { duration: 8000 });
        setSaving(false);
        return;
      }
      const fresh = await res.json();
      setSettings(fresh);
      // Rebuild draft from fresh response — same masking rules.
      const d = {};
      INTEGRATION_SECTIONS.forEach((sec) => sec.fields.forEach((f) => {
        const raw = fresh[f.id] || '';
        if (f.secret && (raw.startsWith('•') || fresh[`${f.id}_set`])) {
          d[f.id] = '';
        } else {
          d[f.id] = raw;
        }
      }));
      setDraft(d);
      toast.success('APIs guardadas. Recarga la página para activar las integraciones del frontend.');
    } catch (err) {
      console.error('[admin/settings save] network error', err);
      toast.error(`Error de red guardando settings: ${err?.message || 'fallo desconocido'}`, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border-border" data-testid="integrations-editor">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" />
          Integraciones &amp; APIs
        </CardTitle>
        {settings?.updated_at && (
          <p className="text-[11px] text-muted-foreground">
            Última actualización: {settings.updated_at.slice(0, 19).replace('T', ' ')}
            {settings.updated_by ? ` por ${settings.updated_by}` : ''}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        {INTEGRATION_SECTIONS.map((sec) => (
          <section key={sec.id} className="space-y-2" data-testid={`integration-section-${sec.id}`}>
            <div>
              <h4 className="text-sm font-semibold">{sec.title}</h4>
              {sec.description && <p className="text-xs text-muted-foreground">{sec.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sec.fields.map((f) => (
                <IntegrationField
                  key={f.id}
                  field={f}
                  value={draft[f.id]}
                  isSet={f.secret ? !!settings?.[`${f.id}_set`] : !!draft[f.id]}
                  onChange={(v) => setDraft({ ...draft, [f.id]: v })}
                />
              ))}
            </div>
          </section>
        ))}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={save} disabled={saving} className="gap-2" data-testid="settings-save">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar todas las APIs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 *  CREATE USER DIALOG
 * ============================================================ */
function CreateUserDialog({ open, onClose, headers, onCreated }) {
  const [form, setForm] = useState({
    email: '', name: '', password: '',
    subscription_plan: 'none',
    is_premium: false, is_admin: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm({ email: '', name: '', password: '', subscription_plan: 'none', is_premium: false, is_admin: false });
  }, [open]);

  const submit = async () => {
    if (!form.email || !form.password || !form.name) {
      toast.error('Email, nombre y contraseña son obligatorios');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...form,
          subscription_plan: form.subscription_plan === 'none' ? null : form.subscription_plan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'create failed');
      toast.success(`Usuario ${data.user.email} creado`);
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error creando usuario');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="create-user-dialog">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>Crea una cuenta directamente desde el panel admin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Email *</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@dominio.com" data-testid="create-email" />
          </div>
          <div>
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="create-name" />
          </div>
          <div>
            <Label>Contraseña *</Label>
            <Input type="text" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 4 caracteres" data-testid="create-password" />
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={form.subscription_plan} onValueChange={(v) => setForm({ ...form, subscription_plan: v })}>
              <SelectTrigger data-testid="create-plan"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_premium">Premium</Label>
            <Switch id="is_premium" checked={form.is_premium}
              onCheckedChange={(v) => setForm({ ...form, is_premium: v })}
              data-testid="create-premium" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_admin">Administrador</Label>
            <Switch id="is_admin" checked={form.is_admin}
              onCheckedChange={(v) => setForm({ ...form, is_admin: v })}
              data-testid="create-admin" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={busy} data-testid="create-submit">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 *  EDIT USER DIALOG
 * ============================================================ */
function EditUserDialog({ user, onClose, headers, onSaved }) {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        name: user.name || '',
        subscription_plan: user.subscription_plan || 'none',
        subscription_end: user.subscription_end ? user.subscription_end.slice(0, 10) : '',
        subscription_status: user.subscription_status || '',
        is_premium: !!user.is_premium,
        is_admin: !!user.is_admin,
      });
    }
  }, [user]);

  if (!user) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const body = {
        name: form.name,
        email: form.email,
        subscription_plan: form.subscription_plan === 'none' ? null : form.subscription_plan,
        subscription_end: form.subscription_end ? new Date(form.subscription_end).toISOString() : null,
        subscription_status: form.subscription_status || null,
        is_premium: form.is_premium,
        is_admin: form.is_admin,
      };
      const res = await fetch(`${API}/admin/users/${user.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'update failed');
      toast.success('Usuario actualizado');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error actualizando usuario');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="edit-user-dialog">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription className="font-mono text-xs">{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="edit-email" />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="edit-name" />
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={form.subscription_plan || 'none'}
              onValueChange={(v) => setForm({ ...form, subscription_plan: v })}>
              <SelectTrigger data-testid="edit-plan"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fin de suscripción (opcional)</Label>
            <Input type="date" value={form.subscription_end || ''}
              onChange={(e) => setForm({ ...form, subscription_end: e.target.value })}
              data-testid="edit-sub-end" />
          </div>
          <div>
            <Label>Estado de suscripción</Label>
            <Select value={form.subscription_status || 'none'}
              onValueChange={(v) => setForm({ ...form, subscription_status: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— (sin estado)</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="canceled">canceled</SelectItem>
                <SelectItem value="past_due">past_due</SelectItem>
                <SelectItem value="expired">expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edit_premium">Premium</Label>
            <Switch id="edit_premium" checked={!!form.is_premium}
              onCheckedChange={(v) => setForm({ ...form, is_premium: v })} data-testid="edit-premium" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edit_admin">Administrador</Label>
            <Switch id="edit_admin" checked={!!form.is_admin}
              onCheckedChange={(v) => setForm({ ...form, is_admin: v })} data-testid="edit-admin" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={busy} data-testid="edit-submit">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 *  RESET PASSWORD DIALOG
 * ============================================================ */
function ResetPasswordDialog({ user, onClose, headers }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) setPw(''); }, [user]);

  if (!user) return null;

  const submit = async () => {
    if (pw.length < 4) { toast.error('Mínimo 4 caracteres'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${API}/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ new_password: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'reset failed');
      toast.success(`Contraseña actualizada para ${user.email}`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error reseteando');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-testid="reset-password-dialog">
        <DialogHeader>
          <DialogTitle>Resetear contraseña</DialogTitle>
          <DialogDescription className="font-mono text-xs">{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Nueva contraseña</Label>
          <Input type="text" value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="Mínimo 4 caracteres" data-testid="reset-input" />
          <p className="text-xs text-muted-foreground">
            El usuario podrá iniciar sesión con esta contraseña inmediatamente.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={busy} data-testid="reset-submit">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
            Resetear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 *  CONFIRM DELETE DIALOG
 * ============================================================ */
function ConfirmDeleteDialog({ user, onClose, onConfirm }) {
  if (!user) return null;
  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-testid="delete-user-dialog">
        <DialogHeader>
          <DialogTitle className="text-destructive">¿Eliminar usuario?</DialogTitle>
          <DialogDescription>
            Vas a borrar permanentemente <span className="font-mono">{user.email}</span> y todos sus datos asociados.
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} data-testid="confirm-delete">
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 *  CUSTOM API MANAGER — añade/edita/borra APIs personalizadas
 * ============================================================ */
function CustomAPIManager({ headers }) {
  const [apis, setApis] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showValue, setShowValue] = useState({});

  const load = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/admin/custom-apis`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApis(data.apis || []);
    } catch (err) {
      toast.error(`Error cargando APIs personalizadas: ${err.message}`);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const openEdit = (api) => { setEditTarget(api); setFormOpen(true); };
  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditTarget(null); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API}/admin/custom-apis/${deleteTarget.id}`, { method: 'DELETE', headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      toast.success(`API "${deleteTarget.name}" eliminada`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Error eliminando API');
    }
  };

  return (
    <Card className="bg-card border-border" data-testid="custom-api-manager">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            APIs Personalizadas
          </CardTitle>
          <Button size="sm" onClick={openCreate} className="gap-2" data-testid="add-custom-api">
            <Plus className="w-4 h-4" /> Añadir API
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Añade claves de APIs externas de forma manual. Se almacenan en base de datos.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {apis.length === 0 && !loadingList ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay APIs personalizadas. Pulsa <strong>Añadir API</strong> para crear la primera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <Th>Nombre</Th>
                  <Th>Clave (key)</Th>
                  <Th>Valor</Th>
                  <Th>Descripción</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {apis.map((api) => (
                  <tr key={api.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{api.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{api.key}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {api.is_secret ? (
                        <div className="flex items-center gap-1">
                          <span>{showValue[api.id] ? api.value : '••••••••'}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6"
                            onClick={() => setShowValue((s) => ({ ...s, [api.id]: !s[api.id] }))}>
                            {showValue[api.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{api.value || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                      {api.description || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {api.value_set
                        ? <Badge className="bg-green-500/15 text-green-500 gap-1"><Check className="w-3 h-3" /> Activa</Badge>
                        : <Badge variant="outline" className="text-muted-foreground gap-1"><X className="w-3 h-3" /> Sin valor</Badge>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="gap-1 h-7"
                          onClick={() => openEdit(api)} data-testid={`edit-custom-api-${api.id}`}>
                          <Pencil className="w-3 h-3" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1 h-7"
                          onClick={() => setDeleteTarget(api)} data-testid={`delete-custom-api-${api.id}`}>
                          <Trash2 className="w-3 h-3" /> Borrar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loadingList && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CustomAPIFormDialog
        open={formOpen}
        onClose={closeForm}
        editTarget={editTarget}
        headers={headers}
        onSaved={() => { closeForm(); load(); }}
      />

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm" data-testid="delete-custom-api-dialog">
            <DialogHeader>
              <DialogTitle className="text-destructive">¿Eliminar API?</DialogTitle>
              <DialogDescription>
                Vas a eliminar <strong>{deleteTarget.name}</strong>{' '}
                (<code className="font-mono text-xs">{deleteTarget.key}</code>).
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-custom-api">
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function CustomAPIFormDialog({ open, onClose, editTarget, headers, onSaved }) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState({
    name: '', key: '', value: '', description: '', is_secret: false, _keyEdited: false,
  });
  const [saving, setSaving] = useState(false);
  const [showVal, setShowVal] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setForm({ name: editTarget.name || '', key: editTarget.key || '', value: '',
        description: editTarget.description || '', is_secret: editTarget.is_secret || false, _keyEdited: true });
    } else {
      setForm({ name: '', key: '', value: '', description: '', is_secret: false, _keyEdited: false });
    }
    setShowVal(false);
  }, [open, editTarget]);

  const autoKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const submit = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!isEdit && !form.key.trim()) { toast.error('La clave identificadora es obligatoria'); return; }
    if (!isEdit && !form.value.trim()) { toast.error('El valor es obligatorio'); return; }
    if (!isEdit && !/^[a-zA-Z0-9_\-]+$/.test(form.key)) {
      toast.error('La clave solo puede contener letras, números, _ y -'); return;
    }
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        const body = { name: form.name, description: form.description, is_secret: form.is_secret };
        if (form.value.trim()) body.value = form.value;
        res = await fetch(`${API}/admin/custom-apis/${editTarget.id}`, {
          method: 'PUT', headers, body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/admin/custom-apis`, {
          method: 'POST', headers,
          body: JSON.stringify({
            name: form.name, key: form.key, value: form.value,
            description: form.description, is_secret: form.is_secret,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      toast.success(isEdit ? 'API actualizada' : 'API creada correctamente');
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Error guardando API');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="custom-api-form-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar: ${editTarget?.name}` : 'Añadir API personalizada'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica los datos. Deja el valor vacío para no cambiarlo.'
              : 'La clave de API se almacenará de forma segura en base de datos.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={(e) => {
                const n = e.target.value;
                setForm((f) => ({ ...f, name: n, ...(!isEdit && !f._keyEdited ? { key: autoKey(n) } : {}) }));
              }}
              placeholder="Ej: OpenAI API Key"
              data-testid="custom-api-name"
            />
          </div>
          <div>
            <Label>Clave identificadora {isEdit ? '(fija)' : '*'}</Label>
            <Input
              value={form.key}
              onChange={(e) => !isEdit && setForm((f) => ({ ...f, key: e.target.value, _keyEdited: true }))}
              placeholder="openai_api_key"
              readOnly={isEdit}
              className={`font-mono text-xs${isEdit ? ' opacity-60 cursor-not-allowed' : ''}`}
              data-testid="custom-api-key"
            />
            {!isEdit && <p className="text-[10px] text-muted-foreground mt-1">Solo letras, números, _ y -</p>}
          </div>
          <div>
            <Label>
              {isEdit && editTarget?.value_set ? 'Nuevo valor (vacío = sin cambios)' : 'Valor *'}
            </Label>
            <div className="flex gap-1">
              <Input
                type={form.is_secret && !showVal ? 'password' : 'text'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={isEdit && editTarget?.value_set ? '(dejar vacío para no cambiar)' : 'sk-...'}
                className="font-mono text-xs"
                autoComplete="off"
                data-testid="custom-api-value"
              />
              {form.is_secret && (
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                  onClick={() => setShowVal((s) => !s)}>
                  {showVal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe para qué sirve esta API"
              data-testid="custom-api-description"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="custom-is-secret" className="cursor-pointer">Valor secreto</Label>
              <p className="text-[10px] text-muted-foreground">El valor se oculta en la tabla</p>
            </div>
            <Switch
              id="custom-is-secret"
              checked={form.is_secret}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_secret: v }))}
              data-testid="custom-api-secret"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} data-testid="custom-api-submit">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? 'Guardar cambios' : 'Crear API'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 *  AUDIT LOG PANEL — every admin write is recorded server-side and
 *  surfaced here for transparency / GDPR / forensics.
 * ============================================================ */

const ACTION_LABELS = {
  'user.create':         { label: 'Usuario creado',       color: 'bg-green-500/15 text-green-600' },
  'user.update':         { label: 'Usuario editado',      color: 'bg-blue-500/15 text-blue-500'   },
  'user.delete':         { label: 'Usuario eliminado',    color: 'bg-red-500/15 text-red-500'     },
  'user.reset_password': { label: 'Password reseteada',   color: 'bg-amber-500/15 text-amber-500' },
  'user.promote':        { label: 'Promovido a admin',    color: 'bg-purple-500/15 text-purple-500' },
  'user.demote':         { label: 'Admin removido',       color: 'bg-slate-500/15 text-slate-400' },
  'settings.update':     { label: 'Settings guardadas',   color: 'bg-indigo-500/15 text-indigo-500' },
  'custom_api.create':   { label: 'API añadida',          color: 'bg-green-500/15 text-green-600' },
  'custom_api.update':   { label: 'API editada',          color: 'bg-blue-500/15 text-blue-500'   },
  'custom_api.delete':   { label: 'API eliminada',        color: 'bg-red-500/15 text-red-500'     },
};

function AuditLogPanel({ headers }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (actionFilter !== 'all') params.set('action', actionFilter);
    if (emailFilter.trim()) params.set('target_email', emailFilter.trim());
    try {
      const res = await fetch(`${API}/admin/audit-log?${params.toString()}`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Error cargando audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <Card className="bg-card border-border" data-testid="audit-log-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Audit log
            <Badge variant="outline" className="ml-2">{total}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-44 h-8 text-xs" data-testid="audit-filter-action">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Filtrar por email afectado"
              className="w-56 h-8 text-xs"
              data-testid="audit-filter-email"
            />
            <Button size="sm" variant="outline" onClick={load} className="gap-2 h-8" data-testid="audit-apply">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Aplicar
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Cada acción admin se registra automáticamente con IP, agente y detalles. Auto-purga a 180 días.
        </p>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <Th>Fecha</Th>
              <Th>Acción</Th>
              <Th>Admin</Th>
              <Th>Afectado</Th>
              <Th>IP</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = ACTION_LABELS[r.action] || { label: r.action, color: 'bg-muted text-muted-foreground' };
              const isOpen = expanded === r.id;
              return (
                <Fragment key={r.id}>
                  <tr className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {r.timestamp ? r.timestamp.slice(0, 19).replace('T', ' ') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={meta.color}>{meta.label}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.admin_email}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.target_email || '—'}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{r.ip || '—'}</td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="ghost"
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                        className="gap-1 h-7" data-testid={`audit-toggle-${r.id}`}>
                        <FileText className="w-3 h-3" /> {isOpen ? 'Ocultar' : 'Detalles'}
                      </Button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-muted/10">
                      <td colSpan={6} className="px-3 py-3">
                        <pre className="text-[11px] font-mono bg-background border border-border rounded p-2 overflow-x-auto">
{JSON.stringify(r.details || {}, null, 2)}
                        </pre>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          User-Agent: <span className="font-mono">{r.user_agent || '—'}</span>
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  {loading ? 'Cargando…' : 'Sin registros'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
