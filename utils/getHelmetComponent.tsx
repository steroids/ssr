import {HelmetData} from 'react-helmet';
import * as React from 'react';

const getHelmetComponent = (helmet: HelmetData, tagName: string) => (
    <React.Fragment key={tagName}>
        {helmet[tagName].toComponent()}
    </React.Fragment>
)

export default getHelmetComponent;
