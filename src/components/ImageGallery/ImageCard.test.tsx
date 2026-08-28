import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageCard } from './ImageCard';

describe('ImageCard', () => {
    const defaultProps = {
        date: '1991-04-01',
        full: '/images/1991/1991-04-01.jpg',
        setSelectedImage: vi.fn(),
    };

    // The filenames are zero-padded and the visible label is not, so the alt
    // text used to read "04. szám - 01. oldal" to a screen reader for a card
    // captioned "1. oldal". Same normalisation as the viewer's caption.
    it('describes the image the way the card is labelled', () => {
        render(<ImageCard {...defaultProps} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', '1991. - 4. szám - 1. oldal');
        expect(img.getAttribute('alt')).not.toMatch(/\b0\d/);
    });

    // Nothing on the old card said a thumbnail was a button.
    it('offers an open affordance for the pointer and the keyboard', () => {
        const { container } = render(<ImageCard {...defaultProps} />);
        expect(container.querySelector('.image-open')).toBeInTheDocument();
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
