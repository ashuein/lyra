'use strict';

import * as React from 'react';
import {Map} from 'immutable';
import {connect} from 'react-redux';
import { throttle } from "throttle-debounce";
import {State} from '../../store';
import {InteractionRecord, ApplicationRecord, SelectionRecord, ScaleInfo, MarkApplicationRecord} from '../../store/factory/Interaction';
import {GroupRecord} from '../../store/factory/marks/Group';
import exportName from '../../util/exportName';
import {Dispatch} from 'redux';
import {setSelection, setApplication} from '../../actions/interactionActions';
import {FormInputProperty} from './FormInputProperty';
import {MarkRecord} from '../../store/factory/Mark';
import {getScaleInfoForGroup} from '../../ctrl/demonstrations';
import {DatasetRecord} from '../../store/factory/Dataset';
import {NumericValueRef, StringValueRef} from 'vega';
import {setMarkVisual} from '../../actions/markActions';

interface OwnProps {
  groupId: number;
  markApplication: MarkApplicationRecord;
}

interface DispatchProps {
  setSelection: (record: SelectionRecord, id: number) => void;
  setMapping: (record: ApplicationRecord, id: number) => void;
  setMarkVisual: (payload: {property: string, def: NumericValueRef | StringValueRef}, markId: number) => void;
}

interface StateProps {
  marks: Map<string, MarkRecord>;
}


function mapStateToProps(state: State, ownProps: OwnProps): StateProps {
  const group: GroupRecord = state.getIn(['vis', 'present', 'marks', String(ownProps.groupId)]);

  const marksOfGroup = Map(group.marks.map(markId => {
    return state.getIn(['vis', 'present', 'marks', String(markId)]);
  }).filter((mark) => {
    return !(mark.type === 'group' || mark.name.indexOf('lyra') === 0);
  }).map((mark) => {
    return [exportName(mark.name), mark];
  }));

  return {
    marks: marksOfGroup
  };
}

function mapDispatchToProps(dispatch: Dispatch): DispatchProps {
  return {
    setSelection: (def: SelectionRecord, id: number) => {
      dispatch(setSelection(def, id));
    },
    setMapping: (def: ApplicationRecord, id: number) => {
      dispatch(setApplication(def, id));
    },
    setMarkVisual: (payload: any, markId: number) => {
      dispatch(setMarkVisual(payload, markId));
    }
  };
}

class BaseInteractionMarkApplicationProperty extends React.Component<OwnProps & StateProps & DispatchProps> {

  constructor(props) {
    super(props);
  }

  private onPropertyChange(e, propertyName, markId):void {
    const value = e.target && e.target.value;
    if (value) {
      this.props.setMarkVisual({
        property: propertyName,
        def: value
      }, markId);
    }
  }

  public render() {

    // mapOptions.push(<option hidden key='_blank1' value=''>Select Channel</option>)
    // fieldOptions.push(<option key='_blank3' value='_vgsid_'>None</option>)

    const propertyName = this.props.markApplication.propertyName;
    const targetMarkName = this.props.markApplication.targetMarkName;
    const targetMark: MarkRecord = this.props.marks.filter((mark, markName) => {
      return markName === targetMarkName;
    }).valueSeq().first();
    const propertyValue = targetMark.encode.update[propertyName];
    const defaultValue = this.props.markApplication.defaultValue;

    const attributes = {};
    switch (propertyName) {
      case 'size':
        attributes['type'] = 'number';
        attributes['min'] = '0';
        attributes['max'] = '500';
        break;
      case 'color':
        attributes['type'] = 'color';
        break;
      case 'opacity':
        attributes['type'] = 'range';
        attributes['min'] = '0';
        attributes['max'] = '1';
        attributes['step'] = '0.05';
        break;
    }

    return (
      <div>
        Selected {propertyName} :
        <FormInputProperty
          name='propertyValue'
          id='propertyValue'
          onChange={(e) => this.onPropertyChange(e, propertyName, targetMark.id)}
          value={propertyValue}
          disabled={false}
          {...attributes}>
        </FormInputProperty>
        <br />

        Default {propertyName} :
        <FormInputProperty
          name='defaultValue'
          id='defaultValue'
          // onChange={(e) => this.onPropertyChange(e, propertyName, targetMark.id)}
          value={defaultValue}
          disabled={false}
          {...attributes}>
        </FormInputProperty>
        <br />
      </div>
    );
  }
};

export const InteractionMarkApplicationProperty = connect(mapStateToProps, mapDispatchToProps)(BaseInteractionMarkApplicationProperty);