import React from 'react';
import classNames from 'classnames';
// import PureRenderMixin from 'rc-util/lib/PureRenderMixin';
import PureRenderMixin from 'react-addons-pure-render-mixin';

// import Row from '../row';
// import Col from '../col';
// import { WrappedFormUtils } from './Form/';
import { FIELD_META_PROP } from './constants';
import warning from 'warning';





// export interface FormItemProps {
//   prefixCls?: string;
//   id?: string;
//   label?: React.ReactNode;
//   labelCol?: FormItemLabelColOption;
//   wrapperCol?: FormItemLabelColOption;
//   help?: React.ReactNode;
//   extra?: string;
//   validateStatus?: 'success' | 'warning' | 'error' | 'validating';
//   hasFeedback?: boolean;
//   className?: string;
//   required?: boolean;
//   style?: React.CSSProperties;
//   colon?: boolean;
// }



export default class FormItem extends React.Component {
  static defaultProps = {
    hasFeedback: false,
    prefixCls: 'md-form',
    colon: true,
  };

  static propTypes = {
    prefixCls: React.PropTypes.string,
    label: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.node]),
    labelCol: React.PropTypes.object,
    help: React.PropTypes.oneOfType([React.PropTypes.node, React.PropTypes.bool]),
    validateStatus: React.PropTypes.oneOf(['', 'success', 'warning', 'error', 'validating']),
    hasFeedback: React.PropTypes.bool,
    wrapperCol: React.PropTypes.object,
    className: React.PropTypes.string,
    id: React.PropTypes.string,
    children: React.PropTypes.node,
    colon: React.PropTypes.bool,
  };

  static contextTypes = {
    form: React.PropTypes.object,
    vertical: React.PropTypes.bool,
  };

  componentDidMount() {
    warning(
      this.getControls(this.props.children, true).length <= 1,
      '`Form.Item` cannot generate `validateStatus` and `help` automatically, ' +
      'while there are more than one `getFieldDecorator` in it.'
    );
  }

  shouldComponentUpdate(...args) {
    return PureRenderMixin.shouldComponentUpdate.apply(this, args);
  }

  getHelpMsg() {
    const context = this.context;
    const props = this.props;
    if (props.help === undefined && context.form) {
      return this.getId() ? (context.form.getFieldError(this.getId()) || []).join(', ') : '';
    }

    return props.help;
  }

  getControls(children, recursively) {
    let controls= [];
    const childrenArray = React.Children.toArray(children);
    for (let i = 0; i < childrenArray.length; i++) {
      if (!recursively && controls.length > 0) {
        break;
      }

      const child = childrenArray[i] ;
      if (child.type  === FormItem) {
        continue;
      }
      if (!child.props) {
        continue;
      }
      if (FIELD_META_PROP in child.props) {
        controls.push(child);
      } else if (child.props.children) {
        controls = controls.concat(this.getControls(child.props.children, recursively));
      }
    }
    return controls;
  }

  getOnlyControl() {
    const child = this.getControls(this.props.children, false)[0];
    return child !== undefined ? child : null;
  }

  getChildProp(prop) {
    const child = this.getOnlyControl();
    return child && child.props && child.props[prop];
  }

  getId() {
    return this.getChildProp('id');
  }

  getMeta() {
    return this.getChildProp(FIELD_META_PROP);
  }

  renderHelp() {
    const prefixCls = this.props.prefixCls;
    const help = this.getHelpMsg();
    return help ? (
      <div className={`${prefixCls}-explain`} key="help">
        {help}
      </div>
    ) : null;
  }

  renderExtra() {
    const { prefixCls, extra } = this.props;
    return extra ? (
      <div className={`${prefixCls}-extra`}>{extra}</div>
    ) : null;
  }

  getValidateStatus() {
    const { isFieldValidating, getFieldError, getFieldValue } = this.context.form;
    const fieldId = this.getId();
    if (!fieldId) {
      return '';
    }
    if (isFieldValidating(fieldId)) {
      return 'validating';
    }
    if (!!getFieldError(fieldId)) {
      return 'error';
    }
    const fieldValue = getFieldValue(fieldId);
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      return 'success';
    }
    return '';
  }

  renderValidateWrapper(c1, c2, c3) {
    let classes = '';
    const form = this.context.form;
    const props = this.props;
    const validateStatus = (props.validateStatus === undefined && form) ?
      this.getValidateStatus() :
      props.validateStatus;

    if (validateStatus) {
      classes = classNames(
        {
          'has-feedback': props.hasFeedback,
          'has-success': validateStatus === 'success',
          'has-warning': validateStatus === 'warning',
          'has-error': validateStatus === 'error',
          'is-validating': validateStatus === 'validating',
        }
      );
    }
    return (
      <div className={`${this.props.prefixCls}-item-control ${classes}`}>
        {c1}{c2}{c3}
      </div>
    );
  }

  renderWrapper(children) {
    const wrapperCol = this.props.wrapperCol;
    return (
      <div {...wrapperCol} key="wrapper">
        {children}
      </div>
    );
  }

  isRequired() {
    const { required } = this.props;
    if (required !== undefined) {
      return required;
    }
    if (this.context.form) {
      const meta = this.getMeta() || {};
      const validate = (meta.validate || []);

      return validate.filter((item) => !!item.rules).some((item) => {
        return item.rules.some((rule) => rule.required);
      });
    }
    return false;
  }

  renderLabel() {
    const props = this.props;
    const context = this.context;
    const labelCol = props.labelCol;
    const required = this.isRequired();

    const className = classNames({
      [`${props.prefixCls}-item-required`]: required,
    });

    let label = props.label;
    // Keep label is original where there should have no colon
    const haveColon = props.colon && !context.vertical;
    // Remove duplicated user input colon
    if (haveColon && typeof label === 'string' && (label).trim() !== '') {
      label = (props.label).replace(/[：|:]\s*$/, '');
    }

    return props.label ? (
      <Col {...labelCol} key="label" className={`${props.prefixCls}-item-label`}>
        <label htmlFor={props.id || this.getId()} className={className}>
          {label}
        </label>
      </Col>
    ) : null;
  }

  renderChildren() {
    const props = this.props;
    const children = React.Children.map(props.children , (child) => {
      if (child && typeof child.type === 'function' && !child.props.size) {
        return React.cloneElement(child, { size: 'large' });
      }
      return child;
    });
    return [
      this.renderLabel(),
      this.renderWrapper(
        this.renderValidateWrapper(
          children,
          this.renderHelp(),
          this.renderExtra()
        )
      ),
    ];
  }

  renderFormItem(children) {
    const props = this.props;
    const prefixCls = props.prefixCls;
    const style = props.style;
    const itemClassName = {
      [`${prefixCls}-item`]: true,
      [`${prefixCls}-item-with-help`]: !!this.getHelpMsg(),
      [`${prefixCls}-item-no-colon`]: !props.colon,
      [`${props.className}`]: !!props.className,
    };

    return (
      <div className={classNames(itemClassName)} style={style}>
        {children}
      </div>
    );
  }

  render() {
    const children = this.renderChildren();
    return this.renderFormItem(children);
  }
}
