import { ActivityMonitor } from '../../../jupyterlab/jupyterlab/packages/coreutils';
import {
  DocumentRegistry,
  IDocumentWidget,
  ABCWidgetFactory,
  DocumentWidget
} from '../../../jupyterlab/jupyterlab/packages/docregistry';
import { PromiseDelegate } from '../../../jupyterlab/jupyterlab/node_modules/@lumino/coreutils';
import {
  BasicKeyHandler,
  BasicMouseHandler,
  BasicSelectionModel,
  DataGrid,
  TextRenderer,
  CellRenderer
} from '../../../jupyterlab/jupyterlab/node_modules/@lumino/datagrid';
import { Message } from '@lumino/messaging';
import {
  ISignal,
  Signal
} from '../../../jupyterlab/jupyterlab/node_modules/@lumino/signaling';
import { PanelLayout, Widget } from '../../../lumino/lumino/packages/widgets';
import {
  CSVViewer,
  CSVDelimiter,
  CSVViewerFactory,
  CSVDocumentWidget,
  GridSearchService
} from '../../../jupyterlab/jupyterlab/packages/csvviewer';
// import { DSVModel } from './model';
import EditableDataGrid from './editabledatagrid';
// import EditableDataModel from './editabledatamodel';

/**
 * The class name added to a CSV viewer.
 */
const CSV_CLASS = 'jp-CSVViewer';

/**
 * The class name added to a CSV viewer datagrid.
 */
const CSV_GRID_CLASS = 'jp-CSVViewer-grid';

/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;

/**
 * A viewer for CSV tables.
 */
export class EditableCSVViewer extends CSVViewer {
  /**
   * Construct a new CSV viewer.
   */
  // constructor(options: EditableCSVViewer.IOptions) {
  //   super(options);
  // }
  constructor(options: EditableCSVViewer.IOptions) {
    super(options);
    const context = (this._context = options.context);
    const layout = (this.layout = new PanelLayout());
    this.addClass(CSV_CLASS);
    this._grid = new EditableDataGrid({
      defaultSizes: {
        rowHeight: 24,
        columnWidth: 144,
        rowHeaderWidth: 64,
        columnHeaderHeight: 36
      }
    });
    this._grid.addClass(CSV_GRID_CLASS);
    this._grid.headerVisibility = 'all';
    this._grid.keyHandler = new BasicKeyHandler();
    this._grid.mouseHandler = new BasicMouseHandler();
    this._grid.copyConfig = {
      separator: '\t',
      format: DataGrid.copyFormatGeneric,
      headers: 'all',
      warningThreshold: 1e6
    };
    layout.addWidget(this._grid);
    this._searchService = new GridSearchService(this._grid);
    this._searchService.changed.connect(this._updateRenderer, this);
    void this._context.ready.then(() => {
      this._updateGrid();
      this._revealed.resolve(undefined);
      // Throttle the rendering rate of the widget.
      this._monitor = new ActivityMonitor({
        signal: context.model.contentChanged,
        timeout: RENDER_TIMEOUT
      });
      this._monitor.activityStopped.connect(this._updateGrid, this);
    });
  }
}

/**
 * A namespace for `CSVViewer` statics.
 */
export namespace EditableCSVViewer {
  /**
   * Instantiation options for CSV widgets.
   */
  export interface IOptions {
    /**
     * The document context for the CSV being rendered by the widget.
     */
    context: DocumentRegistry.Context;
  }
}

/**
 * A document widget for CSV content widgets.
 */
export class EditableCSVDocumentWidget extends CSVDocumentWidget {
  constructor(options: CSVDocumentWidget.IOptions) {
    options.content = Private.createContent(options.context);
    super(options);
  }

  /**
   * Set URI fragment identifier for rows
   */
  setFragment(fragment: string): void {
    const parseFragments = fragment.split('=');

    // TODO: expand to allow columns and cells to be selected
    // reference: https://tools.ietf.org/html/rfc7111#section-3
    if (parseFragments[0] !== '#row') {
      return;
    }

    // multiple rows, separated by semi-colons can be provided, we will just
    // go to the top one
    let topRow = parseFragments[1].split(';')[0];

    // a range of rows can be provided, we will take the first value
    topRow = topRow.split('-')[0];

    // go to that row
    void this.context.ready.then(() => {
      this.content.goToLine(Number(topRow));
    });
  }
}

export namespace EditableCSVDocumentWidget {
  // TODO: In TypeScript 2.8, we can make just the content property optional
  // using something like https://stackoverflow.com/a/46941824, instead of
  // inheriting from this IOptionsOptionalContent.

  export interface IOptions
    extends DocumentWidget.IOptionsOptionalContent<EditableCSVViewer> {
    delimiter?: string;
  }
}

namespace Private {
  export function createContent(
    context: DocumentRegistry.IContext<DocumentRegistry.IModel>
  ) {
    return new EditableCSVViewer({ context });
  }
}

/**
 * A widget factory for CSV widgets.
 */
export class EditableCSVViewerFactory extends CSVViewerFactory {
  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(
    context: DocumentRegistry.Context
  ): IDocumentWidget<CSVViewer> {
    return new CSVDocumentWidget({ context });
  }
}

// /**
//  * A widget factory for TSV widgets.
//  */
// export class TSVViewerFactory extends ABCWidgetFactory<
//   IDocumentWidget<CSVViewer>
// > {
//   /**
//    * Create a new widget given a context.
//    */
//   protected createNewWidget(
//     context: DocumentRegistry.Context
//   ): IDocumentWidget<CSVViewer> {
//     const delimiter = '\t';
//     return new CSVDocumentWidget({ context, delimiter });
//   }
// }
