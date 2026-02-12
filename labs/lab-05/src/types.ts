export interface Comment {
    username: string;
    body: string;
    date: string;
}

export interface PROptions {
    owner: string;
    repo: string;
    prNumber: number;
}
