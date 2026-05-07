import {
  FAQ_ITEMS,
  META_DESCRIPTION,
  SITE_NAME,
  SITE_REPRESENTATIVES,
} from './siteContent';

/** JSON-LD @graph — Google Rich Results · 답변 엔진·생성형 인용 가능한 브랜드·지역 서비스 */
export function buildSchemaOrgGraph(siteOriginRaw: string) {
  const base = siteOriginRaw.replace(/\/$/, '');
  const orgId = `${base}/#organization`;
  const websiteId = `${base}/#website`;
  const webPageId = `${base}/#webpage`;
  const serviceId = `${base}/#service`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness', 'HomeAndConstructionBusiness'],
        '@id': orgId,
        name: SITE_NAME,
        url: `${base}/`,
        logo: { '@type': 'ImageObject', url: `${base}/branding/icon-app.png` },
        image: [`${base}/branding/icon-app.png`, `${base}/branding/icon-mark.png`],
        description: META_DESCRIPTION,
        founder: SITE_REPRESENTATIVES.map((name) => ({
          '@type': 'Person',
          name,
        })),
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KR',
          addressRegion: '경기도',
        },
        areaServed: [
          {
            '@type': 'AdministrativeArea',
            name: '경기 고양시',
          },
          {
            '@type': 'AdministrativeArea',
            name: '경기 파주시',
          },
          {
            '@type': 'AdministrativeArea',
            name: '경기 포천시',
          },
        ],
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '00:00',
          closes: '23:59',
        },
        priceRange: '₩₩',
        currenciesAccepted: 'KRW',
        knowsAbout: [
          '벽걸이 에어컨 수리',
          '스탠드 에어컨 이상',
          '2in1 에어컨 긴급 점검',
          '실외기·냉매 점검',
          '파트너 기사 매칭',
        ],
        serviceType:
          '에어컨 긴급 접수 및 등록 파트너 기사 매칭, 가정용 벽걸이·스탠드·2in1 점검·수리 안내',
        sameAs: [] as string[],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${base}/`,
        name: SITE_NAME,
        publisher: { '@id': orgId },
        inLanguage: 'ko-KR',
        description: META_DESCRIPTION,
        potentialAction: {
          '@type': 'InteractAction',
          name: '긴급 파트너 기사 접수',
          target: `${base}/`,
        },
      },
      {
        '@type': ['WebPage', 'FAQPage'],
        '@id': webPageId,
        url: `${base}/`,
        name: SITE_NAME,
        headline: META_DESCRIPTION.slice(0, 72),
        isPartOf: { '@id': websiteId },
        about: { '@id': orgId },
        description: META_DESCRIPTION,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${base}/` },
          ],
        },
        isAccessibleForFree: true,
        inLanguage: 'ko-KR',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@type': 'Service',
        '@id': serviceId,
        name: '긴급 에어컨 접수·매칭 서비스',
        provider: { '@id': orgId },
        areaServed: ['경기 고양시', '경기 파주시', '경기 포천시'],
        serviceType: '가정용 에어컨 점검·수리 및 등록 파트너 기사 매칭',
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceUrl: `${base}/`,
          availableLanguage: ['ko-KR'],
        },
      },
    ],
  };
}
