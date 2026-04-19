import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Calendar, CreditCard, Download, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch subscription
      const subRes = await fetch(`${API}/api/subscriptions/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subData = await subRes.json();
      setSubscription(subData);
      
      // Fetch billing history
      const invRes = await fetch(`${API}/api/billing/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const invData = await invRes.json();
      setInvoices(invData.invoices || []);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching subscription:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchSubscriptionData();
  }, [isAuthenticated, navigate, fetchSubscriptionData]);

  const handleCancelSubscription = async () => {
    if (!window.confirm(t('estasSeguroDeQueDeseas_8d79cb'))) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${API}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ immediate: false })
      });

      if (response.ok) {
        alert(t('suscripcionCanceladaMantendrasElAcc_7621f5'));
        fetchSubscriptionData();
      } else {
        alert(t('errorAlCancelarLaSuscripcion_6a0cfe'));
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error canceling subscription:', error);
      }
      alert(t('errorAlCancelarLaSuscripcion_6a0cfe'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API}/api/subscriptions/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert(t('suscripcionReactivadaExitosamente_9d30d3'));
        fetchSubscriptionData();
      } else {
        alert(t('errorAlReactivarLaSuscripcion_e38716'));
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error resuming subscription:', error);
      }
      alert(t('errorAlReactivarLaSuscripcion_e38716'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API}/api/billing/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          return_url: window.location.origin + '/subscription'
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error opening portal:', error);
      }
      alert(t('errorAlAbrirElPortal_8e87c5'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Activa', variant: 'default', icon: CheckCircle },
      'trialing': { label: 'Prueba', variant: 'secondary', icon: AlertCircle },
      'canceled': { label: 'Cancelada', variant: 'destructive', icon: AlertCircle },
      'past_due': { label: 'Vencida', variant: 'destructive', icon: AlertCircle }
    };

    const config = statusMap[status] || { label: status, variant: 'outline', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-4 pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-48 bg-muted rounded mb-4"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-4 pt-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('miSuscripcion_6e5d29')}</h1>
            <p className="text-muted-foreground">{t('gestionaTuSuscripcionYFacturacion_2479a9')}</p>
          </div>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('estadoDeLaSuscripcion_5c2c42')}</CardTitle>
              {subscription?.status && getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.has_subscription ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan</p>
                    <p className="text-lg font-semibold">{subscription.plan_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('proximaRenovacion_a01686')}</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive font-medium">
                      Tu suscripción finalizará el {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  {!subscription.cancel_at_period_end ? (
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                    >
                      Cancelar Suscripción
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={handleResumeSubscription}
                      disabled={actionLoading}
                    >
                      Reactivar Suscripción
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleOpenPortal}
                    disabled={actionLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Portal de Facturación
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                  >
                    Ver Planes
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">{t('noTienesUnaSuscripcionActiva_84a892')}</p>
                <p className="text-muted-foreground mb-4">
                  Suscríbete para acceder a todas las funcionalidades Premium
                </p>
                <Button onClick={() => navigate('/pricing')}>
                  Ver Planes Disponibles
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('historialDeFacturacion_91509b')}</CardTitle>
            <CardDescription>Tus facturas y pagos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {invoice.amount} {invoice.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.created)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status === 'paid' ? 'Pagado' : invoice.status}
                      </Badge>
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay facturas disponibles
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
