import {debug} from '../../shared/util/log-util'
export class SearchParams {
    lang: string = 'en';
    count: number = 100;
    result_type: string = 'recent';
    constructor(public q: string, public until: string, public max_id?: string) {
        debug('Search Params: ' + JSON.stringify(this));
    }
    
    format():any {
        return JSON.parse(JSON.stringify(this));
    }
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
