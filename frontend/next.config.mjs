import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
        ],
    },
};

export default withNextIntl(nextConfig);