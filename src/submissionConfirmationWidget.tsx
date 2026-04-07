import {ReactWidget} from "@jupyterlab/apputils";
import {JSX} from "react/jsx-runtime";
import * as React from 'react';
import { TranslationBundle } from "@jupyterlab/translation";

export const SUBMISSION_CONFIRMATION_CLASS = 'e2x-submission-confirmation';
export const SUBMISSION_TIMESTAMP_CLASS = 'e2x-submission-timestamp';

export class SubmissionConfirmationWidget extends ReactWidget {
    constructor(private trans: TranslationBundle, private timestamp: string) {
        super();
    }

    render(): JSX.Element{
        return (
            <div className={SUBMISSION_CONFIRMATION_CLASS}>
                {this.trans.__('Your submission was received at:')}
                <div className={SUBMISSION_TIMESTAMP_CLASS}>{this.timestamp}</div>
                <b>{this.trans.__('Are you done working on your exam?')}</b><br/>
                {this.trans.__('The hashcode will be displayed after exiting the exam.')}
            </div>
        );
    }
}