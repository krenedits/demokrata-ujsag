import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageCard } from './ImageCard';

describe('ImageCard', () => {
    const defaultProps = {
        date: '1991-04-01',
        full: '/images/1991/1991-04-01.jpg',
        setSelectedImage: vi.fn(),
    };

    it('renders the image with a descriptive alt text', () => {
        render(<ImageCard {...defaultProps} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', '1991. - 04. szám - 01. oldal');
    });

    it('displays the correct page number', () => {
        render(<ImageCard {...defaultProps} />);
        expect(screen.getByText('1. oldal')).toBeInTheDocument();
    });

    it('renders as a real, keyboard-accessible button', () => {
        render(<ImageCard {...defaultProps} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls setSelectedImage when clicked', () => {
        render(<ImageCard {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));
        expect(defaultProps.setSelectedImage).toHaveBeenCalledWith(defaultProps.full);
    });

    it('displays version information if present', () => {
        const propsWithVersion = {
            ...defaultProps,
            full: '/images/1991/1991-04-01_1.jpg'
        };
        render(<ImageCard {...propsWithVersion} />);
        expect(screen.getByText('1. oldal (2. verzió)')).toBeInTheDocument();
    });
});
