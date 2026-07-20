import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'what-to-know-before-signing-commercial-lease')!;

export default function WhatToKnowBeforeSigningCommercialLease() {
  return <ArticleLanding data={data} />;
}
