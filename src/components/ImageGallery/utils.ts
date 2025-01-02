import fileList from '../../fileList.json';

const articles = Object.values(fileList)
    .flatMap(Object.values)
    .flatMap(Object.values)
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

export { getAuthors, getTitles };
