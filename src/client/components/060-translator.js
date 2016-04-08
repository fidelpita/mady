import timm                 from 'timm';
import React                from 'react';
import Relay                from 'react-relay';
import {
  ParseSrcFilesMutation,
}                           from '../gral/mutations';
import {
  getScrollbarWidth,
}                           from '../gral/constants';
import {
  bindAll,
  flexItem,
  flexContainer,
}                           from './helpers';
import Select               from './900-select';
import Icon                 from './905-icon';

// ==========================================
// Relay fragments
// ==========================================
const fragments = {
  viewer: () => Relay.QL`
    fragment on Viewer {
      config { langs }
      keys(first: 100000) { edges { node {
        id
        context text
        unusedSince
      }}}
      ${ParseSrcFilesMutation.getFragment('viewer')}
    }
  `,
};

// ==========================================
// Component
// ==========================================
class Translator extends React.Component {
  static propTypes = {
    viewer:                 React.PropTypes.object.isRequired,
    selectedKeyId:          React.PropTypes.string,
    onChangeSelection:      React.PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      langs: this.readLangs(),
    };
    bindAll(this, [
      'renderKeyRow',

      'onAddLang',
      'onRemoveLang',
      'changeLang',

      'onParseSrcFiles',
      'onClickKeyRow',
    ]);
  }

  // ==========================================
  // Render
  // ==========================================
  render() {
    return (
      <div style={style.outer}>
        {this.renderHeader()}
        {this.renderBody()}
      </div>
    );
  }

  renderHeader() {
    const { keys, config } = this.props.viewer;
    const langOptions = config.langs.map(lang => ({ value: lang, label: lang }));
    return (
      <div 
        className="tableHeaderRow"
        style={timm.merge(style.row, style.headerRow)}
      >
        <div style={timm.merge(style.headerCell, style.keysCol)}>
          Keys [{keys.edges.length}]
          {' '}
          <Icon icon="refresh" onClick={this.onParseSrcFiles} />
        </div>
        {this.state.langs.map((lang, idx) => (
          <div key={lang}
            style={timm.merge(style.headerCell, style.langCol)}
          >
            <Select
              id={idx}
              value={lang} 
              onChange={this.changeLang}
              options={langOptions}
            />
            {' '}
            <Icon id={idx} icon="remove" onClick={this.onRemoveLang} />
          </div>)
        )}
        <div style={timm.merge(style.headerCell, style.addCol())}>
          <Icon icon="plus" onClick={this.onAddLang}/>
        </div>
        <div style={style.scrollbarSpacer()}/>
      </div>
    );
  }

  renderBody() {
    return (
      <div
        className="tableBody"
        style={style.body}
      >
        { this.props.viewer.keys.edges.map(this.renderKeyRow) }
        { this.renderFillerRow() }
      </div>
    );
  }

  renderKeyRow({ node: key }) {
    return (
      <div key={key.id}
        className="tableBodyRow"
        id={key.id}
        onClick={this.onClickKeyRow}
        style={timm.merge(style.row, style.bodyRow)}
      >
        <div style={timm.merge(style.bodyCell, style.keysCol)}>
          {key.text}
        </div>
        {this.state.langs.map(lang => (
          <div key={lang}
            style={timm.merge(style.bodyCell, style.langCol)}
          >
            {lang}
          </div>)
        )}
        <div style={timm.merge(style.bodyCell, style.addCol())} />
      </div>
    );
  }

  renderFillerRow() {
    return (
      <div
        className="tableFillerRow"
        style={style.fillerRow}
      >
        <div style={style.keysCol} />
        {this.state.langs.map(lang => (
          <div key={lang}
            style={style.langCol}
          />
        ))}
        <div style={style.addCol()} />
      </div>
    );
  }

  // ==========================================
  // Langs
  // ==========================================
  readLangs() {
    let langs;
    try {
      langs = JSON.parse(localStorage.madyLangs);
    } catch (err) {
      langs = [];
      const availableLangs = this.props.viewer.config.langs;
      if (availableLangs.length) langs.push(availableLangs[0]);
      this.writeLangs(langs);
    }
    return langs;
  }

  writeLangs(langs) {
    try {
      localStorage.madyLangs = JSON.stringify(langs);
    } catch (err) {
      // Ignore error
    }
  }

  onAddLang() {
    const prevLangs = this.state.langs;
    const availableLangs = this.props.viewer.config.langs;
    const newLang = availableLangs.find(o => prevLangs.indexOf(o) < 0);
    if (newLang == null) return;
    const nextLangs = timm.addLast(prevLangs, newLang);
    this.updateLangs(nextLangs);
  }

  onRemoveLang(ev) { this.removeLang(Number(ev.currentTarget.id)); }
  removeLang(idx) {
    const nextLangs = timm.removeAt(this.state.langs, idx);
    this.updateLangs(nextLangs);
  }

  changeLang(lang, idx) {
    const prevLangs = this.state.langs;
    const tempIdx = prevLangs.indexOf(lang);
    if (tempIdx >= 0 && tempIdx < idx) {
      this.removeLang(idx);
      return;
    }
    const nextLangs = timm.replaceAt(this.state.langs, idx, lang);
    this.updateLangs(nextLangs);
  }

  updateLangs(langs) {
    this.writeLangs(langs);
    this.setState({ langs });
  }

  // ==========================================
  // Other handlers
  // ==========================================
  onParseSrcFiles() {
    Relay.Store.commitUpdate(new ParseSrcFilesMutation({ viewer: this.props.viewer }));
  }

  onClickKeyRow(ev) {
    this.props.onChangeSelection(ev.currentTarget.id);
  }
}

// ==========================================
// Styles
// ==========================================
const style = {
  outer: flexItem('1 0 10em', flexContainer('column', {
    marginTop: 5,
  })),

  body: flexItem(1, flexContainer('column', { overflowY: 'scroll' })),

  row: flexItem('none', flexContainer('row')),
  headerRow: { fontWeight: 'bold' },
  bodyRow: {},
  fillerRow: flexItem('1 1 0px', flexContainer('row')),

  headerCell: {
    paddingTop: 3,
    paddingBottom: 3,
    borderBottom: '1px solid black',
  },
  bodyCell: {
    paddingTop: 1,
    paddingBottom: 1,
    borderBottom: '1px solid #ccc',
  },
  keysCol: flexItem('1 1 0px', {
    backgroundColor: '#eee',
    marginRight: 5,
    paddingLeft: 5,
    paddingRight: 5,
  }),
  langCol: flexItem('1 1 0px', {
    backgroundColor: '#eee',
    marginRight: 5,
    paddingLeft: 5,
    paddingRight: 5,
  }),
  addCol: () => flexItem('0 0 2em', {
    backgroundColor: '#ccc',
    marginRight: getScrollbarWidth() ? 5 : 0,
    borderBottom: '0px',
  }),

  scrollbarSpacer: () => flexItem(`0 0 ${getScrollbarWidth()}px`),
};

// ==========================================
// Public API
// ==========================================
export default Relay.createContainer(Translator, { fragments });