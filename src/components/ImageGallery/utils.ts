import fileList from '../../fileList.json';
import { FileList, ImageEntry } from '../../types';

const typedFileList = fileList as FileList;

const articles = Object.values(typedFileList)
    .flatMap(Object.values)
    .flatMap((e) => e as ImageEntry[])
    .flatMap((e) => e.articles ?? []);

const getAuthors = () => {
    return Array.from(new Set(articles.map((e) => e.author))).sort();
};

const compare = (a: string, b: string) => {
    return a.localeCompare(b);
};

const getTitles = (author: string) => {
    if (author) {
        return Array.from(
            new Set(
                articles.filter((e) => e.author === author).map((e) => e.title)
            )
        ).sort(compare);
    }

    return Array.from(new Set(articles.map((e) => e.title))).sort(compare);
};

const parseImagePath = (imagePath: string) => {
    // Expected format: "/images/YYYY/YYYY-RR-PP.jpg" or "./images/YYYY/YYYY-RR-PP_V.jpg"
    const parts = imagePath.split('/').filter(Boolean);
    
    // The filename is always the last part
    const filename = parts[parts.length - 1];
    // The year is usually the part before filename if it follow the /images/YYYY/ structure
    // But we can also get the year from the filename directly as it starts with YYYY-
    
    if (!filename || !filename.includes('.')) {
        return { year: '', release: '', page: '', version: '' };
    }

    const nameParts = filename.split('.')[0].split('-');
    const year = nameParts[0];
    const release = nameParts[1] || '';
    
    const pageAndVersion = (nameParts[2] || '').split('_');
    const page = pageAndVersion[0];
    const version = pageAndVersion[1] || '';

    return {
        year,
        release,
        page,
        version
    };
};

export { getAuthors, getTitles, parseImagePath, typedFileList };
