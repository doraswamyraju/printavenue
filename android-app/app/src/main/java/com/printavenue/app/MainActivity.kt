package com.printavenue.app

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.printavenue.app.data.model.Product
import com.printavenue.app.ui.screens.CatalogScreen
import com.printavenue.app.ui.screens.CheckoutScreen
import com.printavenue.app.ui.screens.CustomizerScreen
import com.printavenue.app.ui.theme.PrintAvenueTheme
import com.printavenue.app.ui.viewmodel.MainViewModel
import com.printavenue.app.ui.viewmodel.ProductsUiState

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Security / Anti-Save / Anti-Screenshot protection
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        setContent {
            PrintAvenueTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF020617)
                ) {
                    val navController = rememberNavController()
                    var activeProduct by remember { mutableStateOf<Product?>(null) }

                    NavHost(navController = navController, startDestination = "catalog") {
                        composable("catalog") {
                            CatalogScreen(
                                viewModel = viewModel,
                                onProductSelected = { prod ->
                                    activeProduct = prod
                                    navController.navigate("customizer")
                                }
                            )
                        }

                        composable("customizer") {
                            activeProduct?.let { prod ->
                                CustomizerScreen(
                                    product = prod,
                                    viewModel = viewModel,
                                    onNavigateBack = { navController.popBackStack() },
                                    onProceedToCheckout = { navController.navigate("checkout") }
                                )
                            }
                        }

                        composable("checkout") {
                            activeProduct?.let { prod ->
                                CheckoutScreen(
                                    product = prod,
                                    viewModel = viewModel,
                                    onNavigateBack = { navController.popBackStack() },
                                    onOrderSuccess = {
                                        navController.navigate("catalog") {
                                            popUpTo("catalog") { inclusive = true }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
