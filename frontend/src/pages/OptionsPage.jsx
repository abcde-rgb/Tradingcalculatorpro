import { Header } from '@/components/layout/Header';
import CalculatorPage from '@/components/options/CalculatorPage';

/**
 * OptionsPage — integrates the full OPTIONS Calculator as a sub-section
 * inside Trading Calculator PRO, preserving TCP's header/theme on top
 * while keeping the Options calculator's dense, professional dark UI.
 */
export default function OptionsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="options-page">
      <Header />
      {/* Spacer for fixed header (64px) */}
      <div className="pt-16">
        {/* Options app renders its own full-height workspace */}
        <div className="h-[calc(100vh-4rem)]">
          <CalculatorPage />
        </div>
      </div>
    </div>
  );
}
