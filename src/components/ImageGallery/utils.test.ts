import { describe, it, expect } from 'vitest';
import { parseImagePath, getAuthors, getTitles } from './utils';

describe('utils', () => {
    describe('parseImagePath', () => {
        it('should parse a standard image path', () => {
            const path = '/images/1991/1991-04-01.jpg';
            const result = parseImagePath(path);
            expect(result).toEqual({
                year: '1991',
                release: '04',
                page: '01',
                version: ''
            });
        });

        it('should parse an image path with version', () => {
            const path = '/images/1991/1991-04-01_1.jpg';
            const result = parseImagePath(path);
            expect(result).toEqual({
                year: '1991',
                release: '04',
                page: '01',
                version: '1'
            });
        });

        it('should handle relative paths with ./', () => {
            const path = './images/1995/1995-12-10.jpg';
            const result = parseImagePath(path);
            expect(result.year).toBe('1995');
        });

        it('should handle empty filename gracefully', () => {
            const result = parseImagePath('/images/1991/');
            expect(result.release).toBe('');
        });
    });

    describe('getAuthors', () => {
        it('should return a list of authors', () => {
            const authors = getAuthors();
            expect(Array.isArray(authors)).toBe(true);
            if (authors.length > 0) {
                expect(typeof authors[0]).toBe('string');
            }
        });
    });

    describe('getTitles', () => {
        it('should return titles even without author', () => {
            const titles = getTitles('');
            expect(Array.isArray(titles)).toBe(true);
        });

        it('should filter titles by author', () => {
            const authors = getAuthors();
            if (authors.length > 0) {
                const author = authors[0];
                const titles = getTitles(author);
                expect(titles.length).toBeGreaterThan(0);
            }
        });
    });
});
