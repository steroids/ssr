import {initRoutes} from '@steroidsjs/core/actions/router';
import {walkRoutesRecursive} from '@steroidsjs/core/ui/nav/Router/Router';
import {setUser} from '@steroidsjs/core/actions/auth';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {ComponentsEnum} from './getComponents';

interface IStoreData {
    routes: any
}

const initStore = (store: IComponents[ComponentsEnum.Store], data: IStoreData) => {
    const toDispatch = [
        {type: '@@redux/INIT'},
        initRoutes(
            walkRoutesRecursive({id: 'root', ...data.routes}),
        ),
        setUser(null)
    ]
    store.dispatch(toDispatch);
}

export default initStore;
