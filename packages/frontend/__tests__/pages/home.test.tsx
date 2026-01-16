/**
 * Test suite for Home Page component
 */

import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('should render the page title', () => {
    render(<HomePage />);
    const heading = screen.getByText('Compliant Platform');
    expect(heading).toBeInTheDocument();
  });

  it('should render the page description', () => {
    render(<HomePage />);
    const description = screen.getByText(/Professional contractor and insurance management/i);
    expect(description).toBeInTheDocument();
  });

  it('should render Get Started link', () => {
    render(<HomePage />);
    const getStartedLink = screen.getByRole('link', { name: /get started/i });
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink).toHaveAttribute('href', '/login');
  });

  it('should render Dashboard link', () => {
    render(<HomePage />);
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('should render technology stack information', () => {
    render(<HomePage />);
    const techInfo = screen.getByText(/Built with Next.js 14, NestJS, PostgreSQL, and Prisma/i);
    expect(techInfo).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    render(<HomePage />);
    const heading = screen.getByText('Compliant Platform');
    expect(heading).toHaveClass('text-6xl', 'font-bold');
  });
});
