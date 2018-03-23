import React, { Component } from 'react';
import {axiosInstance} from './tools.js';
import WalletManagement from './WalletManagement.js';
import Mining from './Mining.js';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import Home from 'material-ui/svg-icons/action/home';
import Settings from 'material-ui/svg-icons/action/settings';
import Lock from 'material-ui/svg-icons/action/lock';
import Blockcount from './widgets/blockcount.js';

class MainPage extends Component {

  constructor(props){
    super(props);
    this.state = {
      'default_wallet': null,
      'account': null,
      'drawer_open': false,
      'page': 'main'
    }
  }

  componentDidMount() {
    this.getDefaultWallet();
    this.props.socket.on('new_block', (socket) => {
      this.getDefaultWallet();
    });
    this.props.socket.on('new_tx_in_pool', (socket) => {
      this.getDefaultWallet();
    });
  }

  drawerToggle = () => this.setState((state) => {
    state.drawer_open = !state.drawer_open;
    return state;
  });

  changePage = (newPage) => {
    this.setState({
      page: newPage,
      drawer_open: false
    })
  }

  getDefaultWallet = () => {
    axiosInstance.get("/wallet/info").then((response) => {
      let data = response.data;
      if(data.hasOwnProperty('wallet') && data.hasOwnProperty('account')) {
        this.setState({default_wallet:data.wallet, account:data.account});
      }
      else {
        this.setState({default_wallet:null});
      }
    });
  }

  onLogout = () => {
    let data = new FormData()
    data.append('delete', true);

    axiosInstance.post('/set_default_wallet', data).then((response) => {
      
    }).catch((error) => {
      this.props.notify('Failed to logout', 'error');
    })
  }

  render() {
    let currentPage = <div />
    if(this.state.page === 'main') {
      currentPage = <WalletManagement notify={this.props.notify} 
                                      default_wallet={this.state.default_wallet} 
                                      account={this.state.account} />;
    }
    else if(this.state.page === 'mining') {
      currentPage = <Mining notify={this.props.notify} 
                            wallet={this.state.default_wallet} 
                            account={this.state.account}
                            socket={this.props.socket} />
    }
    let title = "Halocoin";
    if(this.state.default_wallet !== null) {
      title += " - " + this.state.default_wallet.name;
    }
    return (
      <div>
        <AppBar
          title={title}
          iconClassNameRight="muidocs-icon-navigation-expand-more"
          onLeftIconButtonClick={this.drawerToggle}
        />
        <Drawer open={this.state.drawer_open} docked={false} onRequestChange={(drawer_open) => this.setState({drawer_open})}>
          <MenuItem leftIcon={<Home />} onClick={() => {this.changePage('main')}} >Home</MenuItem>
          <MenuItem leftIcon={<Settings />} onClick={() => {this.changePage('mining')}}>Mining</MenuItem>
          <MenuItem leftIcon={<Lock />} onClick={this.onLogout}>Logout</MenuItem>
        </Drawer>
        {currentPage}
        <Blockcount socket={this.props.socket} notify={this.props.notify}/>
      </div>
    );
  }
}

export default MainPage;
