import bookSvgstr from '../style/icons/book-solid.svg';
import paperPlaneSvgstr from '../style/icons/paper-plane-solid.svg';
import spinnerSvgstr from '../style/icons/ring-resize.svg';
import { LabIcon } from '@jupyterlab/ui-components';

export const bookIcon = new LabIcon({
  name: 'custom-notebook-toolbar:book',
  svgstr: bookSvgstr
});
export const paperPlaneIcon = new LabIcon({
  name: 'custom-notebook-toolbar:paper-plane',
  svgstr: paperPlaneSvgstr
});
export const spinnerIcon = new LabIcon({
  name: 'spinner',
  svgstr: spinnerSvgstr
});
