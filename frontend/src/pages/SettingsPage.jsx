import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { User, Mail, Crown, Calendar, LogOut, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/lib/store';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success(t('sesionCerrada_f86688'));
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="font-unbounded text-2xl font-bold">{t('configuracion_1a0150')}</h1>
          
          {/* Profile Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Subscription Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.is_premium ? (
                <>
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-500">{t('premiumActivo_433549')}</span>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Plan: <span className="text-white capitalize">{user.subscription_plan}</span>
                    </p>
                    {user.subscription_plan !== 'lifetime' && (
                      <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        Expira: {formatDate(user.subscription_end)}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-zinc-400 mb-4">{t('noTienesUnaSuscripcionActiva_84a892')}</p>
                    <Link to="/pricing">
                      <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                        <Crown className="w-4 h-4 mr-2" /> Ver Planes Premium
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
