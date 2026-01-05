import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YearSelector from './YearSelector';

describe('YearSelector', () => {
    const filteredYears = ['1990', '1991', '1992'];

    it('renders all provided years', () => {
        render(<YearSelector selectedImage={null} filteredYears={filteredYears} />);
        filteredYears.forEach(year => {
            expect(screen.getByText(year)).toBeInTheDocument();
        });
    });

    it('marks the selected year as active', () => {
        const selectedImage = '/images/1991/1991-04-01.jpg';
        render(<YearSelector selectedImage={selectedImage} filteredYears={filteredYears} />);
        
        const activeLink = screen.getByText('1991');
        expect(activeLink).toHaveClass('active');
        
        const inactiveLink = screen.getByText('1990');
        expect(inactiveLink).not.toHaveClass('active');
    });

    it('has correct href links', () => {
        render(<YearSelector selectedImage={null} filteredYears={filteredYears} />);
        const link = screen.getByText('1990');
        expect(link).toHaveAttribute('href', '#1990');
    });
});
