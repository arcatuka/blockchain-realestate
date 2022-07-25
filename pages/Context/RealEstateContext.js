import {createContext, useState, useEffect} from 'react'
import {useMoralis, useMoralisQuery} from 'react-moralis'
import { ethers } from 'ethers'
import { realestateAbi, RealEstateAddress } from '../../components/lib/constants'

export const RealEstateContext = createContext()

export const RealEstateProvider =({children}) =>{
  const [currentAccount, setCurrentAccount] = useState('')
  const [balance, setBalance] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [etherscanLink, setEtherscanLink] = useState('')
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [assets, setAssets] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [ownedItems, setOwnedItems] = useState([])

    const {
        authenticate,
        isAuthenticated,
        enableWeb3,
        Moralis,
        user,
        isWeb3Enabled,
      } = useMoralis()

      const {
        data: userData,
        error: userDataError,
        isLoading: userDataIsLoading,
      } = useMoralisQuery('_User')
    

      const {
        data: assetsData,
        error: assetsDataError,
        isLoading: assetsDataIsLoading,
      } = useMoralisQuery('Assets')

      
      const getBalance = async () => {
        try {
          if (!isAuthenticated || !currentAccount) return
          const options = {
            contractAddress: RealEstateAddress,
            functionName: 'balanceOf',
            abi: realestateAbi,
            params: {
              account: currentAccount,
            },
          }
          if (isWeb3Enabled) {
            const response = await Moralis.executeFunction(options)
            console.log(response.toString())
            setBalance(response.toString())
          }
        } catch (error) {
          console.log(error)
        }
      }
    useEffect(() =>{
        ;(async()=>{
            if(isAuthenticated){
              await getBalance()
              await listenToUpdates()
              const currentUsername = await user?.get('nickname')
              setUsername(currentUsername)
              const account = await user?.get('ethAddress')
              setCurrentAccount(account)
              console.log(balance.toString())
            }
        })()
    },[isAuthenticated, user, username, currentAccount, getBalance])

    
    useEffect(() =>{
        ;(async() =>{
        if(isWeb3Enabled) {
            await getAssets()
            await getOwnedAssets()

        }
    })()
    },[isWeb3Enabled,assetsData,assetsDataIsLoading])

    const handleSetUsername =() =>{
        if(user)
        {
            if(nickname)
            {
                user.set('nickname', nickname)
                user.save()
                setNickname('')
            }
            else{
                console.log("can't set empty nickname")
            }
        }
        else{
            console.log('No user')
        }
    }
    
    const buyAsset = async (price, asset) => {
      try {
        if (!isAuthenticated) return
  
        const options = {
          type: 'erc20',
          amount: price,
          receiver: RealEstateAddress,
          contractAddress: RealEstateAddress,
        }
  
        let transaction = await Moralis.transfer(options)
        const receipt = await transaction.wait()
  
        if (receipt) {
          const res = userData[0].add('ownedAsset', {
            ...asset,
            purchaseDate: Date.now(),
            etherscanLink: `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`,
          })
  
          await res.save().then(() => {
            alert("You've successfully purchased this asset!")
          })
        }
      } catch (error) {
        alert("You've cannot purchased this asset.")
        console.log(error.message)
      }
    }

    const buyTokens = async () => {
        if (!isAuthenticated) {
          await authenticate() 
        }
    
        await enableWeb3()
        const amount = ethers.BigNumber.from(tokenAmount)
        const price = ethers.BigNumber.from('100000000000000')
        const calcPrice = amount.mul(price)
        console.log(calcPrice.toString())
        console.log(amount.toString())
        
        let options ={
            contractAddress:RealEstateAddress,
            functionName:'mint',
            abi: realestateAbi, 
            msgValue: calcPrice,
            params:{
                amount, 
            },
        }

        const transaction = await Moralis.executeFunction(options)
        const receipt = await transaction.wait(4)
        setIsLoading(false)
        console.log(receipt)
        setEtherscanLink(
      `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`,
    )
  }

  const listenToUpdates = async () => {
    let query = new Moralis.Query('EthTransactions')
    let subscription = await query.subscribe()
    subscription.on('update', async object => {
      console.log('New Transactions')
      console.log(object)
      setRecentTransactions([object])
    })
  }

    const getAssets = async () => {
        try {
          await enableWeb3()
          // const query = new Moralis.Query('Assets')
          // const results = await query.find()
    
          setAssets(assetsData)
        } catch (error) {
          console.log(error)
        }
    }

    const getOwnedAssets = async () => {
      try {
        // let query = new Moralis.Query('_User')
        // let results = await query.find()
  
        if (userData[0]) {
          setOwnedItems(prevItems => [
            ...prevItems,
            userData[0].attributes.ownedAsset,
          ])
        }
      } catch (error) {
        console.log(error)
      }
    }
  

    return(
        <RealEstateContext.Provider
        value={{
            isAuthenticated,
            nickname,
            setNickname,
            username,
            setUsername,
            handleSetUsername,
            assets,
            balance,
            setTokenAmount,
            tokenAmount,
            amountDue,
            setAmountDue,
            isLoading,
            setIsLoading,
            setEtherscanLink,
            etherscanLink,  
            currentAccount,
            buyTokens,
            buyAsset,
            recentTransactions,
            ownedItems,
        }}
        >
            {children}
        </RealEstateContext.Provider>
    )
}