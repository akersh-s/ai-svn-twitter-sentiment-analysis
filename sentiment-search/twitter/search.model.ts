export class SearchParams {
    lang: 'en';
    count: number = 100;
    result_type: string = 'recent';
    constructor(public q: string, public until: string, public maxId?: string) { }
}

export interface SearchResult {
    statuses: Status[],
    search_metadata: SearchMetadata
}

export interface Status {
    text: string;
    created_at: string;
}

export interface SearchMetadata {
    next_results: string;
}
