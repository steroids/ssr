import {Request} from 'express';

const detectLanguage = (req: Request) => {
    const languages = Array.from(process.env.APP_SSR_LANGUAGES);
    return req.acceptsLanguages(...languages) || '';
}

export default detectLanguage;
