import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Crown, DollarSign, TrendingUp, Search, Download,
  Shield, ShieldOff, RefreshCw, Mail, Globe2, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { useSEO } from '@/hooks/useSEO';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * /admin — gated by `is_admin === true`. Shows global metrics, a filterable
 * users table, CSV export and an inline "promote / demote" toggle for
 * admin rights.
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
  const [locale, setLocaleFilter] = useState('all');

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
      if (mRes.status === 403 || uRes.status === 403) {
        toast.error(t('adminAccessDenied'));
        navigate('/dashboard');
        return;
      }
      if (!mRes.ok || !uRes.ok) throw new Error('load failed');
      setMetrics(await mRes.json());
      const data = await uRes.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
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
            <Button onClick={handleExportCsv} className="gap-2" data-testid="admin-export-csv">
              <Download className="w-4 h-4" /> {t('adminExportCsv')}
            </Button>
          </div>
        </div>

        {/* Metrics grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard
              icon={Users} label={t('adminMetricUsers')}
              value={metrics.total_users} testId="metric-total-users"
            />
            <MetricCard
              icon={Crown} label={t('adminMetricPremium')}
              value={metrics.premium_users} valueClass="text-primary" testId="metric-premium"
            />
            <MetricCard
              icon={DollarSign} label="MRR"
              value={`$${metrics.mrr_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              valueClass="text-green-500" testId="metric-mrr"
            />
            <MetricCard
              icon={TrendingUp} label={t('adminMetricNew30d')}
              value={metrics.new_users_30d} testId="metric-new-30d"
            />
            <MetricCard
              icon={Globe2} label={t('adminMetricLocales')}
              value={metrics.by_locale.length} testId="metric-locales"
            />
          </div>
        )}

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
            <table className="w-full text-sm" data-testid="admin-users-table">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <Th><Mail className="w-3 h-3 inline" /> Email</Th>
                  <Th>{t('adminColName')}</Th>
                  <Th>{t('adminColPlan')}</Th>
                  <Th>{t('adminColStatus')}</Th>
                  <Th>{t('adminColProvider')}</Th>
                  <Th><Calendar className="w-3 h-3 inline" /> {t('adminColCreated')}</Th>
                  <Th>{t('adminColActions')}</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">
                      <Badge variant={u.is_premium ? 'default' : 'outline'}>
                        {u.subscription_plan || 'free'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={u.is_premium ? 'default' : 'secondary'} className={u.is_premium ? 'bg-green-500/15 text-green-600' : ''}>
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
                      <Button
                        size="sm"
                        variant={u.is_admin ? 'destructive' : 'outline'}
                        onClick={() => togglePromote(u.email, u.is_admin)}
                        className="gap-1 h-7"
                        data-testid={`admin-toggle-${u.email}`}
                      >
                        {u.is_admin
                          ? <><ShieldOff className="w-3 h-3" /> {t('adminDemote')}</>
                          : <><Shield className="w-3 h-3" /> {t('adminPromote')}</>}
                      </Button>
                    </td>
                  </tr>
                ))}
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
      </main>
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
