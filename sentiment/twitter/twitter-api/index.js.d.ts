export class Twitter {
    /**
     * 
     * @param options 
     * @return  
     */
    constructor(options: any);
        
    /**
     * 
     * @param path 
     * @param base 
     * @return  
     */
    __buildEndpoint(path : any, base : string): any;
        
    /**
     * 
     * @param method 
     * @param path 
     * @param params 
     * @param callback 
     */ 
    __request(method : string, path : any, params : any, callback : any): void;
        
    /**
     * GET
     * @param url 
     * @param params 
     * @param callback 
     */
    get(url : any, params : any, callback : any): void;
        
    /**
     * POST
     * @param url 
     * @param params 
     * @param callback 
     */
    post(url : any, params : any, callback : any): void;
        
    /**
     * STREAM
     * @param method 
     * @param params 
     * @param callback 
     */
    stream(method : any, params : any, callback : any): void;
}