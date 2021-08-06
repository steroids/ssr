import {IListProps} from '@steroidsjs/core/ui/list/List/List';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {listFetch, listInit, listSetItems} from '@steroidsjs/core/actions/list';
import {defaultConfig} from '@steroidsjs/core/hooks/useList';
import {normalizePaginationSizeProps} from '@steroidsjs/core/ui/list/PaginationSize/PaginationSize';
import {normalizePaginationProps} from '@steroidsjs/core/ui/list/Pagination/Pagination';
import {normalizeLayoutNamesProps} from '@steroidsjs/core/ui/list/LayoutNames/LayoutNames';
import {formInitialize} from '@steroidsjs/core/actions/form';
import _get from 'lodash-es/get';
import _flatten from 'lodash-es/flatten';
import {queryRestore} from '@steroidsjs/core/hooks/useAddressBar';

const initLists = (listsConfigs: IListProps[], components: IComponents): Promise<any> => { //TODO передавать правильный query
    const promises = listsConfigs.map(config => {
        const sort = {
            ...defaultConfig.sort,
            enable: !!config.sort,
            ...(typeof config.sort === 'boolean' ? {enable: config.sort} : config.sort),
        };
        const paginationSizeProps = normalizePaginationSizeProps(config.paginationSize);
        const paginationProps = normalizePaginationProps(config.pagination);
        const layoutNamesProps = normalizeLayoutNamesProps(config.layout);

        const location = components.store.getState().router.location || null;
        const searchModel = components.meta.normalizeModel(
            components.meta.getModel(config.searchModel || config.searchForm?.model),
            {
                attributes: [
                    paginationProps.enable && {
                        type: 'number',
                        attribute: paginationProps.attribute,
                        defaultValue: paginationProps.defaultValue,
                    },
                    paginationSizeProps.enable && {
                        type: 'number',
                        attribute: paginationSizeProps.attribute,
                        defaultValue: paginationSizeProps.defaultValue,
                    },
                    sort.enable && {
                        type: 'string',
                        jsType: 'string[]',
                        attribute: sort.attribute,
                        defaultValue: sort.defaultValue,
                    },
                    layoutNamesProps.enable && {
                        type: 'string',
                        attribute: layoutNamesProps.attribute,
                        defaultValue: layoutNamesProps.defaultValue,
                    },
                ].filter(Boolean),
            }
        );

        const initialQuery = queryRestore(searchModel, location, config.useHash);
        const formId = _get(config, 'searchForm.formId') || config.listId;
        const initialValues = {
            [paginationProps.attribute]: paginationProps.defaultValue,
            [paginationSizeProps.attribute]: paginationSizeProps.defaultValue,
            [sort.attribute]: sort.defaultValue,
            [layoutNamesProps.attribute]: layoutNamesProps.defaultValue,
            ...initialQuery,
            ...config.query,
        };
        components.store.dispatch(formInitialize(formId, initialValues));
        components.store.dispatch(listInit(
            config.listId,
            {
                listId: config.listId,
                action: config.action || config.action === '' ? config.action : null,
                actionMethod: config.actionMethod || defaultConfig.actionMethod,
                onFetch: config.onFetch,
                condition: config.condition,
                scope: config.scope,
                items: null,
                sourceItems: config.items || null,
                isRemote: !config.items,
                primaryKey: config.primaryKey || defaultConfig.primaryKey,
                sortAttribute: sort.attribute || null,
                pageSizeAttribute: paginationSizeProps.attribute || null,
                loadMore: paginationProps.loadMore,
                pageAttribute: paginationProps.attribute || null,
                layoutAttribute: layoutNamesProps.attribute || null,
                formId
            }
        ));

        components.store.dispatch(listSetItems(config.listId, config.items));
        return components.store.dispatch(listFetch(config.listId));
    })

    return Promise.all(_flatten(promises));
}

export default initLists;
