import { Link } from 'react-router-dom';
import { TrendingUp, Sun, Moon, Globe, Twitter, Github, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { useThemeStore } from '@/lib/theme';

/**
 * Global footer used across all authenticated/public pages.
 * Uses i18n strings from LandingPage for consistency.
 */
export function Footer() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 py-12 px-4 border-t border-border bg-card/30 backdrop-blur-sm" data-testid="site-footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">{t('appName') || 'Trading Calculator PRO'}</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t('tagline') || 'Calculadoras profesionales, opciones con Greeks en tiempo real, backtesting y más — todo en una sola plataforma.'}
            </p>
            <div className="flex items-center gap-2 mt-5">
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Twitter" data-testid="footer-twitter">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="GitHub" data-testid="footer-github">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="LinkedIn" data-testid="footer-linkedin">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Email" data-testid="footer-email">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-foreground/90">{t('product') || 'Producto'}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors" data-testid="footer-dashboard">{t('dashboard') || 'Dashboard'}</Link></li>
              <li><Link to="/options" className="hover:text-primary transition-colors" data-testid="footer-options">Opciones</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors" data-testid="footer-pricing">{t('pricing') || 'Precios'}</Link></li>
              <li><Link to="/subscription" className="hover:text-primary transition-colors" data-testid="footer-subscription">Suscripción</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-foreground/90">{t('resources') || 'Recursos'}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/education" className="hover:text-primary transition-colors" data-testid="footer-education">{t('educationCenter') || 'Aprendizaje'}</Link></li>
              <li><Link to="/options" className="hover:text-primary transition-colors">Academia de Opciones</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('apiDocs') || 'API Docs'}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('support') || 'Soporte'}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-foreground/90">{t('legal') || 'Legal'}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t('terms') || 'Términos'}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('privacyPolicy') || 'Privacidad'}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('cookies') || 'Cookies'}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
            <p className="text-muted-foreground text-xs">
              © {year} {t('appName') || 'Trading Calculator PRO'}. {t('allRightsReserved') || 'Todos los derechos reservados'}.
            </p>
            <span className="hidden md:inline text-muted-foreground/40">·</span>
            <p className="text-muted-foreground/70 text-[11px] max-w-xl leading-snug">
              Los datos son informativos. No constituyen asesoramiento financiero. Invertir conlleva riesgos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label="Cambiar tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Idioma">
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
