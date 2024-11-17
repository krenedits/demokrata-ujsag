import fileList from '../../fileList.json';

const articles = Object.values(fileList)
    .flatMap(Object.values)
    .flatMap(Object.values)
    .flatMap((e) => e.articles ?? []);

const getAuthors = () => {
    return Array.from(new Set(articles.map((e) => e.author))).sort();
};

const getTitles = (author: string) => {
    if (author) {
        return Array.from(
            new Set(
                articles.filter((e) => e.author === author).map((e) => e.title)
            )
        ).sort();
    }

    return Array.from(new Set(articles.map((e) => e.title))).sort();
};

export { getAuthors, getTitles };