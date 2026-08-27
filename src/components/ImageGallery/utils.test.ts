import { describe, it, expect } from 'vitest';
import { parseImagePath, getAuthors, getTitles, isValidYear, isKnownImage } from './utils';

describe('utils', () => {
    describe('isValidYear', () => {
        it('accepts a year the archive actually has', () => {
            expect(isValidYear('1991')).toBe(true);
        });

        it('rejects a year the archive does not have', () => {
            expect(isValidYear('2050')).toBe(false);
            expect(isValidYear(undefined)).toBe(false);
            expect(isValidYear('')).toBe(false);
        });

        // `year in fileList` matched these, so /constructor rendered as a real
        // year — own title, own canonical URL, and no redirect.
        it('rejects inherited Object.prototype keys', () => {
            expect(isValidYear('constructor')).toBe(false);
            expect(isValidYear('toString')).toBe(false);
            expect(isValidYear('valueOf')).toBe(false);
            expect(isValidYear('hasOwnProperty')).toBe(false);
            expect(isValidYear('__proto__')).toBe(false);
        });
    });

    describe('isKnownImage', () => {
        it('accepts a page the archive actually has', () => {
            expect(isKnownImage('/images/1989/1989-01-01.jpg')).toBe(true);
        });

        it('rejects paths that do not resolve to a real page', () => {
            expect(isKnownImage('/images/2050/2050-01-01.jpg')).toBe(false);
            expect(isKnownImage('/images/1991/1991-99-01.jpg')).toBe(false);
            expect(isKnownImage('not-an-image-path')).toBe(false);
            expect(isKnownImage('')).toBe(false);
        });
    });

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
            const author = authors[0];
            if (author) {
                const titles = getTitles(author);
                expect(titles.length).toBeGreaterThan(0);
            }
        });
    });
});
