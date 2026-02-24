'use client';

import { useTranslations } from 'next-intl';

type PlanSelection = 'FREE' | 'PREMIUM';

interface PlanCardProps {
    plan: PlanSelection;
    selected: boolean;
    onSelect: (plan: PlanSelection) => void;
    price: string;
    features: string[];
    popular?: boolean;
}

export default function PlanCard({ plan, selected, onSelect, price, features, popular = false }: PlanCardProps) {
    const t = useTranslations('auth.register.plans');

    return (
        <div
            className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                selected
                    ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-lg'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50'
            } ${popular ? 'ring-2 ring-[var(--accent)]/30' : ''}`}
            onClick={() => onSelect(plan)}
        >
            {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                    {t('popular')}
                </div>
            )}
            
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{t(`${plan.toLowerCase()}.title`)}</h3>
                {selected && (
                    <div className="h-5 w-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="mb-4">
                <span className="text-3xl font-bold text-white">{price}</span>
                {plan === 'PREMIUM' && (
                    <span className="ml-2 text-[var(--text-secondary)]">{t('monthly')}</span>
                )}
            </div>

            <ul className="space-y-2">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-[var(--text-secondary)]">
                        <svg
                            className="mr-2 h-5 w-5 flex-shrink-0 text-[var(--accent)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>
    );
}
