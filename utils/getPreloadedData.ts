import {Request} from 'express';
import {matchPath} from 'react-router-dom';
import {IRouteItem} from '@steroidsjs/core/ui/nav/Router/Router';
import {treeToList} from '@steroidsjs/core/ui/nav/Router/helpers';
import {IListProps} from '@steroidsjs/core/ui/list/List/List'
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {getConfigId, normalizeConfig, fetchData, IFetchConfig} from '@steroidsjs/core/hooks/useFetch';
import {IPreloadedData} from '@steroidsjs/core/providers/SsrProvider';

const addCancelTokenMock = () => {}

const getRoutePreloadData = (routesTree: IRouteItem, path: Request['path']): (IFetchConfig | IListProps)[] => {
    for (const route of treeToList(routesTree)) {
        const matchResult = matchPath(path, route);
        if (matchResult) {
            return route.preloadData
                ? route.preloadData(matchResult)
                : [];
        }
    }

    return [];
};

export const getPreloadConfigs = (routesTree: IRouteItem, path: Request['path']): {routeFetchConfigs: IFetchConfig[], routeListsConfigs: IListProps[]} => {
    const fetchConfigs = [];
    const listsConfigs = [];

    const routePreloadData = getRoutePreloadData(routesTree, path);

    routePreloadData.forEach(config => {
        if ('listId' in config) {
            listsConfigs.push(config);
        } else {
            fetchConfigs.push(config);
        }
    });

    return {
        routeFetchConfigs: fetchConfigs,
        routeListsConfigs: listsConfigs,
    };
}

const normalizeError = (error: unknown) => {
    if ((error as any)?.isAxiosError) {
        const axiosError = error as any;
        return {
            isAxiosError: true,
            status: axiosError.response?.status,
            message: axiosError.message,
            data: axiosError.response?.data,
        };
    }

    if (error instanceof Error) {
        return {
            isAxiosError: false,
            message: error.message,
        };
    }

    return {
        isAxiosError: false,
        message: String(error),
    };
};

const getPreloadedFetchesData = async (
    fetchConfigs: IFetchConfig[],
    components: IComponents
): Promise<IPreloadedData> => {
    const fetchPromises = fetchConfigs
        .map(normalizeConfig)
        .map((config, index) =>
            fetchData(config, components, addCancelTokenMock)
                .then(data => ({ ok: true, data }))
                .catch(error => ({ ok: false, error: normalizeError(error) }))
        );

    const results = await Promise.all(fetchPromises);

    return results.reduce((acc, result, index) => {
        const configId = getConfigId(fetchConfigs[index]);

        acc[configId] = result.ok
            ? result.data
            : {
                __error: true,
                error: result.error,
            };

        return acc;
    }, {} as IPreloadedData);
};

export default getPreloadedFetchesData;
