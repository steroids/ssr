# SSR
### Запуск SSR
Для запуска SSR используйте команду: ```node webpack production ssr && node public/server.js```.

### Настройка webpack
Для настройки SSR в конфигурацию ```@steroidsjs/webpack``` можно передать несколько параметров:

Параметр | Значение по умолчанию | Описание
------------ | ------------- | -------------
```serverPath``` | ```node_modules/@steroidsjs/ssr/index.ts``` | Путь до файла, в котором запускается SSR.
```applicationPath``` | ```src/Application.tsx``` | Файл, который экспортирует компонент ```Application``` (по умолчанию)  и переменную ```config```. В переменной ```config``` содержится конфигурация с типом ```IApplicationHookConfig``` для хука ```useApplication```. Без этих данных SSR работать не будет.
```initActionPath``` | ```src/shared/Layout/Layout.tsx``` | Файл, который экспортирует функцию ```initAction```. Эта функция передаётся в хук ```useLayout``` и нужна для первоначальной подгрузки данных с бэкенда и инициализации приложения.
```ssr``` | ```{}``` | Дополнительная webpack-конфигурация для серверной сборки.
```languages``` | ```['en']``` | Языки приложения в порядке приоритета. Нужна, чтобы SSR в зависимости от ```accept-language``` понимал, какой перевод нужно отдать на клиент.

Пример:
```
require('@steroidsjs/webpack')
  .config({
    port: 9991,
    sourcePath: __dirname + '/src',
    staticPath: '',
    baseUrl: 'frontend/',
    serverPath: '/node_modules/@steroidsjs/ssr/index.ts',
    applicationPath: 'src/Application.tsx',
    initActionPath: 'src/shared/Layout/Layout.tsx',
    ssr: {
      module: {
        rules: {...}
      }
    },
    languages: ['ru', 'en'],
  })
  .base(__dirname + '/src/index.tsx');
```

### Предзагрузка данных
На этапе серверного рендеринга можно подгрузить данные для хука ```useFetch```  и компонента ```List```.
Для этого:
1. вынесите пропсы из ```useFetch``` / ```List``` в константы
2. в дереве роутов для нужной страницы укажите поле ```preloadData```, поместите в него функцию, которая принимает параметры URL и возвращает массив с пропсами.

Хук ```useFetch``` и компонент ```List``` не будут повторно инициализироваться и делать запросы на клиенте, если подгруженные данные существуют.

Пример:
```
'routes/ProductPage.tsx'

export const fetchConfig = match => ({url: `/api/products/${match.params.productId}`})
export const listConfig = {listId: 'favoritesList', action: '/api/favorites'}
```

```
'routes/intex.ts'

import {fetchConfig, listConfig} from './DetailPage'

export default {
    id: ROUTE_ROOT,
    exact: true,
    path: '/',
    title: 'Home',
    component: IndexPage,
    roles,
    items: {
        [ROUTE_PRODUCT_PAGE]: {
            path: '/catalog/:productId',
            component: ProductPage,
            roles,
            preloadData: match => [fetchConfig(match), listConfig]
        },
    },
}
```
Пропсы компонента ```List``` следует передавать в ```preloadData```, даже если ```items``` не нужно подгружать с бэкенда.
Иначе компонент не отрендерится на сервере.

### HTML-теги
Чтобы добавить в html-разметку теги ```title```, ```meta```, ```script```, ```link```, ```styles```, ```noscript```, используйте компонент ```@steroidsjs/core/ui/layout/Meta```.
Общие для всего сайта теги можно указать в компоненте ```Layout```, а теги характерные для каждой страницы - в компонентах страниц (т.е. ```title```, ```description``` и т.п.), они перезапишут общие.

```
<Meta
  title={__('Заголовок страницы')}
  description={__('Описание страницы')}
  meta={[
      {
          name: 'yandex-verification',
          content: 'ce38...39e6'
      },
      {
          name: 'google-site-verification',
          content: 'sdf8...39e6'
      }
  ]}
  scripts={[
      {src: 'https://some-script.min.js'},
  ]}
/>
```
