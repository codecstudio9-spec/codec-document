import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'what-is-an-nda')!;

export default function WhatIsAnNda() {
  return <ArticleLanding data={data} />;
}
