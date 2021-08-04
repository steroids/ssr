import {init, setUser} from '@steroidsjs/core/actions/auth';
import {runInitAction} from '@steroidsjs/core/hooks/useLayout';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';

const initApplication = async (components: IComponents) => {
    const {initAction} = require('_SsrInitAction');

    if (initAction) {
        components.store.dispatch(init(true));
        await runInitAction(initAction, components, components.store.dispatch);
        return;
    }

    components.store.dispatch(setUser(null));
}

export default initApplication;
