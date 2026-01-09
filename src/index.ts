import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { E2XContentFactoryStudent } from './factory';
import { E2xGraderCellRegistry } from '@e2xgrader/core';
import { ITranslator } from '@jupyterlab/translation';
import { registerCommands } from './commands';
import { IToolbarWidgetRegistry } from '@jupyterlab/apputils';
import { ToolbarItems } from './notebook_toolbar';
/**
 * Initialization data for the @e2xgrader/student extension.
 */
const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> =
  {
    id: '@e2xgrader/student:plugin',
    description: 'A JupyterLab extension for e2xgrader student mode',
    autoStart: true,
    requires: [IEditorServices, E2xGraderCellRegistry.IE2xGraderCellRegistry],
    provides: NotebookPanel.IContentFactory,
    activate: (
      _app: JupyterFrontEnd,
      editorServices: IEditorServices,
      cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry
    ) => {
      console.log('JupyterLab extension @e2xgrader/student is activated!');

      const editorFactory = editorServices.factoryService.newInlineEditor;
      const contentFactory = new E2XContentFactoryStudent(
        {
          editorFactory
        },
        undefined,
        cellRegistry
      );
      console.log('E2XContentFactory created:', contentFactory);
      return contentFactory;
    }
  };

const studentCommandsPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:commands',
  description: 'A JupyterLab extension for e2xgrader student mode',
  autoStart: true,
  requires: [
    ITranslator,
    INotebookTracker,
    IToolbarWidgetRegistry,
    ISettingRegistry
  ],
  activate: async (
    app: JupyterFrontEnd,
    translator: ITranslator,
    tracker: INotebookTracker,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingRegistry: ISettingRegistry
  ) => {
    console.log('Register commands plugin activated');
    const settings = await settingRegistry.load(studentCommandsPlugin.id);
    console.log('Settings loaded:', settings);
    registerCommands(app, tracker, translator, settings);
    toolbarRegistry.addFactory<NotebookPanel>(
      'Notebook',
      'e2xCellType',
      panel => ToolbarItems.createCellTypeItem(panel, translator)
    );
  }
};

export default [cellFactoryPlugin, studentCommandsPlugin];
