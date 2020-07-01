import { MutableDataModel, DataModel } from '@lumino/datagrid';
import { DSVModel } from '@jupyterlab/csvviewer';

export default class EditableDSVModel extends MutableDataModel {
  constructor(options: DSVModel.IOptions) {
    super();

    this._dsvModel = new DSVModel(options);
  }

  get dsvModel(): DSVModel {
    return this.dsvModel;
  }

  rowCount(region: DataModel.RowRegion): number {
    return this._dsvModel.rowCount(region);
  }

  columnCount(region: DataModel.ColumnRegion): number {
    return this._dsvModel.columnCount(region);
  }

  metadata(
    region: DataModel.CellRegion,
    row: number,
    column: number
  ): DataModel.Metadata {
    return this._dsvModel.metadata(region, row, column);
  }

  data(region: DataModel.CellRegion, row: number, column: number): any {
    return this._dsvModel.data(region, row, column);
  }

  setData(
    region: DataModel.CellRegion,
    row: number,
    column: number,
    value: any
  ): boolean {
    const model = this._dsvModel;

    console.log('setData method called');

    // Look up the field and value for the region.
    switch (region) {
      case 'body':
        if (model._header.length === 0) {
          model._setField(row, column, value);
        } else {
          model._setField(row + 1, column, value);
        }
        console.log('setting field in body');
        break;
      //   case 'column-header':
      //     if (model._header.length === 0) {
      //       value = (column + 1).toString();
      //     } else {
      //       value = model._header[column];
      //     }
      //     break;
      //   case 'row-header':
      //     value = (row + 1).toString();
      //     break;
      //   case 'corner-header':
      //     value = '';
      //     break;
      default:
        throw 'unreachable';
    }

    this.emitChanged({
      type: 'cells-changed',
      region: 'body',
      row: row,
      column: column,
      rowSpan: 1,
      columnSpan: 1
    });

    return true;
  }

  private _dsvModel: DSVModel;
}
