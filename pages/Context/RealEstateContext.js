import {createContext, useState, useEffect} from 'react'
import {useMoralis, useMoralisQuery} from 'react-moralis'
import { ethers } from 'ethers'
import { realestateAbi, RealEstateAddress } from '../../components/lib/constants'

export const RealEstateContext = createContext()

export const RealEstateProvider =({children}) =>{
    const [assets, setAssets] = useState([])
    const [nickname, setNickname] = useState('')
    const [username, setUsername] = useState('')
    const [currentAccount, setCurrentAccount] = useState('')
    const [tokenAmount, setTokenAmount] = useState('')
    const [amountDue, setAmountDue] = useState('')
    const [etherscanLink, setEtherscanLink] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [balance, setBalance] = useState('')

    
    const {
        authenticate,
        isAuthenticated,
        enableWeb3,
        Moralis,
        user,
        isWeb3Enabled,
      } = useMoralis()

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
              account: currentAccount
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
                const currentUsername = await user?.get('nickname')
                setUsername(currentUsername)
                const account = await user?.get('ethAddress')
                setCurrentAccount(account)
            }
        })() 
    },[isAuthenticated, user, username, currentAccount, getBalance])

    
    useEffect(() =>{
        ;(async() =>{
        if(isWeb3Enabled) {
            await getAssets()
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
    
    // const connectWallet = async () => {
    //     await enableWeb3()
    //     await authenticate()
    //   }

    const buyTokens = async () => {
        if (!isAuthenticated) {
          await authenticate()
        }
    
        const amount = ethers.BigNumber.from(tokenAmount)
        const price = ethers.BigNumber.from('100000000000000')
        const calcPrice = amount.mul(price)
    
        console.log(RealEstateAddress)
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
            buyTokens
        }}
        >
            {children}
        </RealEstateContext.Provider>
    )
}