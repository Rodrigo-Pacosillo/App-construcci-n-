type LocalBusinessData = {
  name: string;
  url: string;
  logo: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  priceRange: string;
  description: string;
  sameAs: string[];
};

export function LocalBusinessJsonLd(data: LocalBusinessData) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    url: data.url,
    logo: data.logo,
    telephone: data.telephone,
    email: data.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      addressRegion: data.address.addressRegion,
      addressCountry: data.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    },
    priceRange: data.priceRange,
    description: data.description,
    sameAs: data.sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

type WebPageData = {
  name: string;
  description: string;
  url: string;
  isPartOf: { "@id": string };
};

export function WebPageJsonLd(data: WebPageData) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.name,
    description: data.description,
    url: data.url,
    isPartOf: data.isPartOf,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

type ServiceData = {
  name: string;
  description: string;
  url: string;
  provider: { "@id": string };
};

export function ServiceJsonLd(data: ServiceData) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: data.name,
    description: data.description,
    url: data.url,
    provider: data.provider,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

type FAQPageData = {
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
};

export function FAQPageJsonLd(data: FAQPageData) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.mainEntity,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}