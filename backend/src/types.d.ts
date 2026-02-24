import { Request } from 'express';

// Extend Express Request to have typed params
declare module 'express-serve-static-core' {
    interface ParamsDictionary {
        [key: string]: string;
    }
}
