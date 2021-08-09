import _get from 'lodash-es/get';
import _flatten from 'lodash-es/flatten';
import {IListProps} from '@steroidsjs/core/ui/list/List/List';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {listFetch, listInit, listSetItems} from '@steroidsjs/core/actions/list';
import {
    createInitialValues,
    defaultConfig,
    getDefaultSearchModel,
    normalizeSortProps
} from '@steroidsjs/core/hooks/useList';
import {normalizePaginationSizeProps} from '@steroidsjs/core/ui/list/PaginationSize/PaginationSize';
import {normalizePaginationProps} from '@steroidsjs/core/ui/list/Pagination/Pagination';
import {normalizeLayoutNamesProps} from '@steroidsjs/core/ui/list/LayoutNames/LayoutNames';
import {formInitialize} from '@steroidsjs/core/actions/form';
import {queryRestore} from '@steroidsjs/core/hooks/useAddressBar';

const initLists = (listsConfigs: IListProps[], components: IComponents): Promise<any> => {
    const promises = listsConfigs.map(config => {
        const sort = normalizeSortProps(config.sort);
        const paginationSizeProps = normalizePaginationSizeProps(config.paginationSize);
        const paginationProps = normalizePaginationProps(config.pagination);
        const layoutNamesProps = normalizeLayoutNamesProps(config.layout);

        const searchModel = components.meta.normalizeModel(
            components.meta.getModel(config.searchModel || config.searchForm?.model),
            getDefaultSearchModel({
                paginationSizeProps,
                paginationProps,
                layoutNamesProps,
                sort
            })
        );

        const location = components.store.getState().router.location || null;
        const formId = _get(config, 'searchForm.formId') || config.listId;

        const toDispatch = [
            formInitialize(
                formId,
                createInitialValues({
                    paginationSizeProps,
                    paginationProps,
                    layoutNamesProps,
                    sort,
                    initialQuery: queryRestore(searchModel, location, config.useHash),
                    configQuery: config.query,
                })
            ),
            listInit(
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
            ),
            listSetItems(config.listId, config.items)
        ]

        components.store.dispatch(toDispatch);
        return components.store.dispatch(listFetch(config.listId));
    })

    return Promise.all(_flatten(promises));
}

export default initLists;
