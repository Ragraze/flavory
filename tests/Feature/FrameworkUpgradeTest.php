<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrameworkUpgradeTest extends TestCase
{
    public function test_product_pages_work_without_a_database_connection(): void
    {
        config(['database.default' => 'unavailable']);
        foreach (['/', '/mustika-rasa', '/mustika-rasa/mr-c24e640dcf3f', '/resep', '/resep/baru', '/resep/pasta-tomat-bawang', '/tersimpan', '/rencana', '/belanja', '/pengaturan', '/privasi'] as $path) {
            $this->get($path)->assertOk()->assertSee('Flavory')->assertSee('id="main"', false);
        }
    }

    public function test_health_and_browser_security_headers_are_available(): void
    {
        $this->getJson('/health')->assertOk()->assertJson(['status' => 'ok', 'storage' => 'browser']);
        $response = $this->get('/')->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY');
        $this->assertStringContainsString("frame-ancestors 'none'", $response->headers->get('Content-Security-Policy'));
    }

    public function test_legacy_credential_and_destructive_get_endpoints_are_retired(): void
    {
        foreach (['/api/delete-account', '/api/my-reseps', '/api/get-reseps'] as $path) {
            $this->getJson($path)->assertNotFound();
        }
        $this->postJson('/api/auth', ['username' => 'test', 'password' => 'test'])->assertNotFound();
        $this->postJson('/api/create-resep', [])->assertNotFound();
        $this->get('/login')->assertRedirect('/pengaturan');
    }
}
