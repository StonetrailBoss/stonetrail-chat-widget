import { RouteObject } from "react-router";
import { lazy } from 'react';
import HomePage from './pages/index';
const LandingPage = lazy(() => import('./pages/lp/index'));
const BookDirectPage = lazy(() => import('./pages/lp/book-direct'));
const BlogIndexPage = lazy(() => import('./pages/blog/index'));
const BlogPostPage = lazy(() => import('./pages/blog/[slug]'));
const BookPage = lazy(() => import('./pages/reservations'));
const RoomsPage = lazy(() => import('./pages/rooms'));
const DestinationPage = lazy(() => import('./pages/destination'));
const AboutPage = lazy(() => import('./pages/about'));
const ContactPage = lazy(() => import('./pages/contact'));
const PoliciesPage = lazy(() => import('./pages/policies'));
const SuperiorVillaPage = lazy(() => import('./pages/villas/superior-villa'));
const HoneymoonSuitePage = lazy(() => import('./pages/villas/honeymoon-suite'));
const GardenRetreatPage = lazy(() => import('./pages/villas/garden-retreat'));
const GardenFamilyVillaPage = lazy(() => import('./pages/villas/garden-family-villa'));
const GardenJuniorSuitePage = lazy(() => import('./pages/villas/garden-junior-suite'));
const PresidentialSuitePage = lazy(() => import('./pages/villas/presidential-suite'));
const DeluxeKingPage = lazy(() => import('./pages/villas/deluxe-king'));
// Company / Careers pages
const CareersPage = lazy(() => import('./pages/company/careers/index'));
const OurWorkplacePage = lazy(() => import('./pages/company/careers/our-workplace'));
const MessageFromCeoPage = lazy(() => import('./pages/company/careers/message-from-ceo'));
const CareerOpportunitiesPage = lazy(() => import('./pages/company/careers/opportunities'));
export const routes: RouteObject[] = [{
  index: true,
  element: <HomePage />
}, {
  path: '/lp',
  element: <LandingPage />
}, {
  path: '/lp/:slug',
  element: <LandingPage />
}, {
  path: '/lp/book-direct',
  element: <BookDirectPage />
}, {
  path: '/blog',
  element: <BlogIndexPage />
}, {
  path: '/blog/:slug',
  element: <BlogPostPage />
}, {
  path: '/book',
  element: <BookPage />
}, {
  path: '/rooms',
  element: <RoomsPage />
}, {
  path: '/rooms/superior-villa',
  element: <SuperiorVillaPage />
}, {
  path: '/rooms/honeymoon-suite',
  element: <HoneymoonSuitePage />
}, {
  path: '/rooms/garden-retreat',
  element: <GardenRetreatPage />
}, {
  path: '/rooms/garden-family-villa',
  element: <GardenFamilyVillaPage />
}, {
  path: '/rooms/garden-junior-suite',
  element: <GardenJuniorSuitePage />
}, {
  path: '/rooms/presidential-suite',
  element: <PresidentialSuitePage />
}, {
  path: '/rooms/deluxe-king',
  element: <DeluxeKingPage />
}, {
  path: '/destination',
  element: <DestinationPage />
}, {
  path: '/about',
  element: <AboutPage />
}, {
  path: '/contact',
  element: <ContactPage />
}, {
  path: '/policies',
  element: <PoliciesPage />
}, {
  path: '/company/careers',
  element: <CareersPage />
}, {
  path: '/company/careers/our-workplace',
  element: <OurWorkplacePage />
}, {
  path: '/company/careers/message-from-ceo',
  element: <MessageFromCeoPage />
}, {
  path: '/company/careers/opportunities',
  element: <CareerOpportunitiesPage />
}];
export type Path = '/' | '/book' | '/rooms' | '/rooms/superior-villa' | '/rooms/honeymoon-suite' | '/rooms/garden-retreat' | '/destination' | '/about' | '/contact' | '/policies' | '/staff/login' | '/staff/inventory';
export type Params = Record<string, string | undefined>;
