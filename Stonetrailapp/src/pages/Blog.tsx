// /Blog (capital B) → permanent redirect to /blog
// This file exists only to catch any old links; the canonical URL is /blog.
import { Navigate } from 'react-router';
export default function BlogRedirect() {
  return <Navigate to="/blog" replace />;
}
