import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

/**
 * Google sign-in button. Drops next to the email/password form on the
 * login & register pages. Renders Google's official `<GoogleLogin>` button
 * (rendered inside an iframe by Google Identity Services), and on success
 * forwards the returned ID token to our backend for verification.
 *
 * The button auto-themes (dark/light) and resizes responsively. We just
 * own the wrapper styling and the post-success redirect.
 */
export default function GoogleSignInButton() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { loginWithGoogle } = useAuthStore();
  const [busy, setBusy] = useState(false);

  // Map our short locale codes to Google's supported locale strings.
  const googleLocaleMap = {
    es: 'es', en: 'en', de: 'de', fr: 'fr',
    ru: 'ru', zh: 'zh_CN', ja: 'ja', ar: 'ar',
  };
  const googleLocale = googleLocaleMap[locale] || 'en';

  const handleSuccess = async (response) => {
    if (busy) return;
    setBusy(true);
    const result = await loginWithGoogle(response.credential);
    setBusy(false);
    if (result.success) {
      toast.success(t('bienvenido_b33c1f'));
      navigate('/dashboard');
    } else {
      toast.error(result.error || t('googleSignInError'));
    }
  };

  const handleError = () => toast.error(t('googleSignInError'));

  return (
    <div className="space-y-3" data-testid="google-signin-block">
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {t('orContinueWith')}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <div className="flex justify-center" data-testid="google-signin-button">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme="filled_black"
          size="large"
          shape="rectangular"
          width="320"
          locale={googleLocale}
          useOneTap={false}
        />
      </div>
    </div>
  );
}
