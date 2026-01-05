export interface Article {
  author: string;
  title: string;
}

export interface ImageEntry {
  image: string;
  image_k?: string;
  date: string;
  articles?: Article[];
  text?: string;
}

export interface FileList {
  [year: string]: {
    [release: string]: ImageEntry[];
  };
}
