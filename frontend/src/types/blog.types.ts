export interface Blog {
  id: string;
  title: string;
  author: string;
  date: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  content?: string;
  coverImage?: string | null;
  shortDescription?: string;
  slug?: string;
  categories?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  featured?: boolean;
  readingTime?: string;
}
