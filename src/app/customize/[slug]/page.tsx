import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/storage';
import { CustomizerStudio } from '@/components/CustomizerStudio';

interface Props {
  params: {
    slug: string;
  };
}

export default function CustomizePage({ params }: Props) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <CustomizerStudio product={product} />;
}

